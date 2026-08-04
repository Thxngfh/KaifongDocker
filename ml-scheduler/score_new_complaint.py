"""
score_new_complaint.py
=====================
รับ complaint_id เดียว -> โหลด model artifact ที่ active อยู่ (ไม่ train ใหม่)
-> predict risk_prob/risk_tier/shap top factors -> เขียนลง complaint_risk_log

ใช้ตอน event-driven scoring (listener.py เรียกไฟล์นี้) และเรียกตรงจาก CLI ก็ได้
เพื่อทดสอบ:
    docker exec -it kaifong_risk_listener python3 /app/scripts/score_new_complaint.py <complaint_id> <tenant_id> <tenant_code>
"""
import os
import sys
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import psycopg2
from sqlalchemy import create_engine

from risk_features import (
    risk_tier, describe_feature, add_time_features,
    apply_hist_encoding, add_static_features, ALL_FEATURES, CAT_FEATURES,
)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
MODEL_DIR = Path(os.environ.get("RISK_MODEL_DIR", "/app/models"))
TOP_N_FACTORS = int(os.environ.get("RISK_TOP_N_FACTORS", 5))


def log(msg):
    from datetime import datetime
    print(f"[{datetime.now().isoformat(timespec='seconds')}] {msg}", flush=True)


def get_active_model_path(engine, tenant_id, tenant_code):
    row = pd.read_sql(
        "SELECT model_version FROM model_registry WHERE tenant_id=%(t)s AND status='active'",
        engine, params={"t": tenant_id}
    )
    if row.empty:
        raise RuntimeError(f"ยังไม่มี active model สำหรับ tenant_id={tenant_id} — รอ batch train รอบแรกก่อน")
    version = row.iloc[0]['model_version']
    path = MODEL_DIR / tenant_code / f"{version}.joblib"
    if not path.exists():
        raise RuntimeError(f"model_registry บอกว่า active={version} แต่หาไฟล์ {path} ไม่เจอ "
                            f"(เช็ค volume ml_models ว่า mount ตรงกันไหม)")
    return path


def load_complaint_row(engine, complaint_id):
    df = pd.read_sql("""
        SELECT c.*, cat.category_name, sub.subcategory_name,
               p.priority_code, p.sla_response_time_min,
               sm.sla_resolution_time_min
        FROM complaints c
        JOIN categories cat ON cat.category_id = c.category_id
        LEFT JOIN subcategories sub ON sub.subcategory_id = c.subcategory_id
        LEFT JOIN priority_levels p ON p.priority_id = c.priority_id
        LEFT JOIN sla_matrix sm ON sm.subcategory_id = c.subcategory_id AND sm.priority_id = c.priority_id
        WHERE c.complaint_id = %(cid)s
    """, engine, params={"cid": complaint_id})
    # NOTE: ปรับชื่อ column ให้ตรงกับ schema จริงของคุณถ้าไม่ตรง
    if df.empty:
        raise RuntimeError(f"ไม่พบ complaint_id={complaint_id}")
    for col in ['created_at', 'latitude', 'longitude']:
        if col in df.columns and col != 'created_at':
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
    return df


def score_one(complaint_id, tenant_id, tenant_code, engine):
    artifact_path = get_active_model_path(engine, tenant_id, tenant_code)
    artifact = joblib.load(artifact_path)

    df = load_complaint_row(engine, complaint_id)
    df = add_time_features(df)
    df = apply_hist_encoding(df, artifact['historical_encoders'])
    df = add_static_features(df)

    X = df[ALL_FEATURES].copy()
    for c in CAT_FEATURES:
        X[c] = X[c].fillna('UNKNOWN')
    X_proc = artifact['preprocessor'].transform(X)

    risk_prob = float(artifact['model'].predict_proba(X_proc)[:, 1][0])
    tier = risk_tier(risk_prob)

    # SHAP เฉพาะเคสนี้ (เบากว่า batch เพราะมีแถวเดียว)
    top_factors = []
    try:
        import shap
        model = artifact['model']
        if hasattr(model, 'feature_importances_'):
            explainer = shap.TreeExplainer(model)
            shap_raw = explainer.shap_values(X_proc)
            shap_row = shap_raw[1][0] if isinstance(shap_raw, list) else np.asarray(shap_raw)[0, :, 1] \
                if np.asarray(shap_raw).ndim == 3 else np.asarray(shap_raw)[0]
        else:
            explainer = shap.LinearExplainer(model, X_proc)
            shap_raw = explainer.shap_values(X_proc)
            shap_row = np.asarray(shap_raw[1][0] if isinstance(shap_raw, list) else shap_raw[0])

        # ชื่อ feature หลัง one-hot (ต้องได้จาก preprocessor ที่บันทึกไว้)
        try:
            cat_names = list(
                artifact['preprocessor'].named_transformers_['cat']
                .named_steps['onehot'].get_feature_names_out(CAT_FEATURES)
            )
        except Exception:
            cat_names = []
        all_feat = artifact['num_features'] + cat_names
        n = min(len(shap_row), len(all_feat))
        idx = np.argsort(-np.abs(shap_row[:n]))[:TOP_N_FACTORS]
        top_factors = [{"factor": describe_feature(all_feat[i]), "impact": round(float(shap_row[i]), 4)} for i in idx]
    except Exception as e:
        log(f"⚠️ SHAP คำนวณไม่ได้ (ไม่กระทบ risk_score): {e}")

    return {
        "complaint_id": str(complaint_id),
        "risk_score": round(risk_prob, 3),
        "risk_tier": tier,
        "model_version": artifact['model_version'],
        "shap_top_factors": top_factors,
    }


def write_result(result, tenant_id):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO complaint_risk_log
                (tenant_id, complaint_id, risk_score, risk_tier, model_status, model_version, shap_top_factors)
            VALUES (%s, %s, %s, %s, 'active', %s, %s)
            ON CONFLICT (complaint_id, model_version)
            DO UPDATE SET risk_score = EXCLUDED.risk_score,
                          risk_tier = EXCLUDED.risk_tier,
                          shap_top_factors = EXCLUDED.shap_top_factors,
                          scored_at = now()
        """, (tenant_id, result['complaint_id'], result['risk_score'], result['risk_tier'],
              result['model_version'], json.dumps(result['shap_top_factors'], ensure_ascii=False)))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("usage: python3 score_new_complaint.py <complaint_id> <tenant_id> <tenant_code>")
        sys.exit(1)
    complaint_id, tenant_id, tenant_code = sys.argv[1], sys.argv[2], sys.argv[3]
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL ไม่ได้ตั้งค่า")
    engine = create_engine(DATABASE_URL)
    result = score_one(complaint_id, tenant_id, tenant_code, engine)
    write_result(result, tenant_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
