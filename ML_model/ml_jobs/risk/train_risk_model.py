"""
train_risk_model.py
=====================
Complaint Risk Prediction Model (SLA Breach) — headless/production version.
Converted from complaint_risk_prediction_v8.ipynb for scheduled batch runs.

Pipeline:
  1. Load data from DB
  2. Build SLA-breach label (RESOLVED/CLOSED only, REJECTED excluded)
  3. Temporal train/val/test split (70/15/15) — no shuffling, avoids leakage
  4. Historical target-encoding features fit on TRAIN only (m-estimate smoothing)
  5. Preprocess (impute+scale numeric, impute+one-hot categorical) + SMOTE on train
  6. Retrain loop across 6 candidate models, model selection by VALIDATION AUC only
  7. Final unbiased evaluation on TEST set (touched once)
  8. Feature importance (Thai labels) for the dashboard "risk factors" card
  9. Score all currently OPEN complaints (risk_prob, risk_tier)
  10. SHAP TreeExplainer -> top-5 factors per open case
  11. Save model artifact (joblib) for potential real-time scoring later
  12. Write results to DB: model_registry + complaint_risk_log (promote if better than
      current active, by TEST AUC), optionally ping a dashboard-refresh webhook

Promotion logic:
  - No active model yet          -> promote immediately
  - This run's TEST AUC > active's TEST AUC -> promote (archive old)
  - Otherwise                    -> insert as 'staging' only (history)
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, average_precision_score
from imblearn.over_sampling import SMOTE

import psycopg2
import psycopg2.extras
import joblib
import requests


# ============================================================
# Config — env-driven so the same image works across environments
# ============================================================
DATABASE_URL = "postgresql://kaifong:kaifong1234@localhost:5433/kaifongdb" # e.g. postgresql://kaifong:kaifong1234@db:5432/kaifongdb

ACCEPT_ROC_AUC = float(os.environ.get("RISK_ACCEPT_ROC_AUC", 0.75))   # validation threshold to stop retrain loop
MAX_RETRAIN_ROUNDS = int(os.environ.get("RISK_MAX_RETRAIN_ROUNDS", 3))
TOP_N_FACTORS = int(os.environ.get("RISK_TOP_N_FACTORS", 5))          # SHAP factors kept per case
MODEL_DIR = Path(os.environ.get("RISK_MODEL_DIR", "/app/models"))
DASHBOARD_REFRESH_API = os.environ.get("DASHBOARD_REFRESH_API", "")   # leave empty to skip the webhook call

TARGET = 'sla_breached'
CAT_FEATURES = ['category_name', 'subcategory_name', 'priority_code', 'district']
NUM_FEATURES = [
    'hour_of_day', 'day_of_week', 'month_of_year', 'is_weekend', 'is_working_hours',
    'cat_breach_rate_hist', 'dist_breach_rate_hist', 'sub_breach_rate_hist',
    'cat_volume', 'dist_volume', 'sla_response_time_min', 'sla_resolution_time_min',
    'has_sla_matrix', 'has_coordinates', 'detail_len',
]
ALL_FEATURES = CAT_FEATURES + NUM_FEATURES

THAI_LABELS = {
    'hour_of_day':            'เวลาที่แจ้งเรื่อง (ชั่วโมง)',
    'day_of_week':             'วันในสัปดาห์ที่แจ้งเรื่อง',
    'month_of_year':           'เดือนที่แจ้งเรื่อง',
    'is_weekend':              'แจ้งเรื่องช่วงวันหยุดสุดสัปดาห์',
    'is_working_hours':        'แจ้งเรื่องในเวลาทำการ',
    'cat_breach_rate_hist':    'อัตราเกิน SLA ของหมวดหมู่นี้ (ในอดีต)',
    'dist_breach_rate_hist':   'อัตราเกิน SLA ของพื้นที่นี้ (ในอดีต)',
    'sub_breach_rate_hist':    'อัตราเกิน SLA ของประเภทย่อยนี้ (ในอดีต)',
    'cat_volume':              'ปริมาณเคสสะสมของหมวดหมู่นี้',
    'dist_volume':             'ปริมาณเคสสะสมของพื้นที่นี้',
    'sla_response_time_min':   'เวลาตอบสนองตาม SLA (นาที)',
    'sla_resolution_time_min': 'เวลาที่กำหนดแก้ไขตาม SLA (นาที)',
    'has_sla_matrix':          'มีการกำหนด SLA ไว้ชัดเจน',
    'has_coordinates':         'มีพิกัดตำแหน่งแนบมาด้วย',
    'detail_len':              'ความยาวของรายละเอียดที่แจ้ง',
}
CAT_LABEL_PREFIX = {
    'category_name':    'หมวดหมู่',
    'subcategory_name': 'ประเภทย่อย',
    'priority_code':    'ระดับความสำคัญ',
    'district':          'พื้นที่',
}


def log(msg):
    print(f"[{datetime.now().isoformat(timespec='seconds')}] {msg}", flush=True)

def clean_raw_data(df):
    df = df.drop_duplicates(subset=['complaint_id'])
    text_cols = ['district', 'category_name', 'subcategory_name', 'detail']
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
    return df

def describe_feature(fname):
    for col in CAT_FEATURES:
        prefix = col + "_"
        if fname.startswith(prefix):
            value = fname[len(prefix):]
            return f"{CAT_LABEL_PREFIX.get(col, col)}: {value}"
    return THAI_LABELS.get(fname, fname)


def risk_tier(p):
    if p >= 0.7:
        return 'HIGH'
    if p >= 0.4:
        return 'MEDIUM'
    return 'LOW'


# ============================================================
# 1. Load data
# ============================================================
def load_data(engine):
    tables = ['complaints', 'categories', 'subcategories', 'priority_levels', 'sla_matrix', 'workflow_logs']
    dfs = {}
    for t in tables:
        dfs[t] = pd.read_sql(f'SELECT * FROM public.{t}', engine)
        log(f'{t:20s}: {len(dfs[t]):>7,} rows')
    v_sla = pd.read_sql('SELECT * FROM public.v_complaint_sla', engine)
    log(f'{"v_complaint_sla":20s}: {len(v_sla):>7,} rows')
    return dfs, v_sla


# ============================================================
# 2. Build label + base df
# ============================================================
def build_labeled_df(dfs, v_sla):
    complaints    = dfs['complaints'].copy()
    categories    = dfs['categories'].copy()
    subcategories = dfs['subcategories'].copy()
    priority_lvl  = dfs['priority_levels'].copy()
    sla_matrix    = dfs['sla_matrix'].copy()
    workflow_logs = dfs['workflow_logs'].copy()

    for col in ['created_at', 'updated_at', 'resolved_at', 'closed_at', 'due_date']:
        if col in complaints.columns:
            complaints[col] = pd.to_datetime(complaints[col], errors='coerce')
    complaints['latitude']  = pd.to_numeric(complaints.get('latitude'),  errors='coerce')
    complaints['longitude'] = pd.to_numeric(complaints.get('longitude'), errors='coerce')
    workflow_logs['action_datetime'] = pd.to_datetime(workflow_logs.get('action_datetime'), errors='coerce')

    complaints = clean_raw_data(complaints)
  
    reject_ids = set(workflow_logs.loc[workflow_logs['action_type'] == 'REJECT', 'complaint_id'])
    sla_breach_label = v_sla.set_index('complaint_id')['is_resolution_breached'].rename('sla_breached')

    df = complaints.merge(sla_breach_label, on='complaint_id', how='left')
    df['was_rejected'] = df['complaint_id'].isin(reject_ids).astype(int)

    # เรื่องที่ "สรุปผลแล้ว" เท่านั้น (RESOLVED + CLOSED) ใช้เทรน/วัดผลได้ (รู้ label จริง)
    mask_concluded = df['resolved_at'].notna() | df['closed_at'].notna()
    df_model = df[mask_concluded].copy()
    df_model['sla_breached'] = df_model['sla_breached'].astype('float')

    n_has_sla = df_model['sla_breached'].notna().sum()
    n_breach  = (df_model['sla_breached'] == True).sum()
    log(f'SLA performance: {n_has_sla:,} cases with SLA matrix defined, '
        f'breach rate={n_breach / n_has_sla:.1%}' if n_has_sla else 'No cases with SLA matrix defined')

    df = df_model.copy()
    df['sla_breached'] = df['sla_breached'].fillna(False).astype(int)

    df = df.merge(categories[['category_id', 'category_name', 'category_code']], on='category_id', how='left')
    df = df.merge(subcategories[['subcategory_id', 'subcategory_name', 'subcategory_code']], on='subcategory_id', how='left')
    df = df.merge(priority_lvl[['priority_id', 'priority_name', 'priority_code', 'sla_response_time_min']],
                   on='priority_id', how='left')
    df = df.merge(sla_matrix[['subcategory_id', 'priority_id', 'sla_resolution_time_min']],
                   on=['subcategory_id', 'priority_id'], how='left')

    log(f'Labeled df: {df.shape}')
    return df, reject_ids, categories, subcategories, priority_lvl, sla_matrix, complaints


# ============================================================
# 3. Temporal split + historical (target) encoding — fit on TRAIN only
# ============================================================
def temporal_split(df):
    df = df.sort_values('created_at').reset_index(drop=True)
    n = len(df)
    train_end_idx = int(n * 0.70)
    val_end_idx = int(n * 0.85)

    train_cutoff_date = df.iloc[train_end_idx]['created_at']
    val_cutoff_date = df.iloc[val_end_idx]['created_at']

    train_mask = df['created_at'] < train_cutoff_date
    val_mask = (df['created_at'] >= train_cutoff_date) & (df['created_at'] < val_cutoff_date)
    test_mask = df['created_at'] >= val_cutoff_date

    df_train = df[train_mask].copy()
    df_val = df[val_mask].copy()
    df_test = df[test_mask].copy()

    log(f'Train: {len(df_train):,} | Val: {len(df_val):,} | Test: {len(df_test):,}  (cutoff={train_cutoff_date})')
    return df_train, df_val, df_test, train_cutoff_date


def fit_target_encoder(train_df, group_col, target_col='sla_breached', m=10, prior=None):
    prior = prior if prior is not None else train_df[target_col].mean()
    agg = train_df.groupby(group_col)[target_col].agg(['sum', 'count'])
    rate = (agg['sum'] + m * prior) / (agg['count'] + m)
    return rate, prior


def fit_historical_encoders(df_train):
    m = 10
    cat_rate_map, cat_prior = fit_target_encoder(df_train, 'category_id', m=m)
    dist_rate_map, dist_prior = fit_target_encoder(df_train, 'district', m=m)
    sub_rate_map, sub_prior = fit_target_encoder(df_train, 'subcategory_id', m=m)
    cat_vol_map = df_train.groupby('category_id')['complaint_id'].count()
    dist_vol_map = df_train.groupby('district')['complaint_id'].count()
    return {
        'cat_rate_map': cat_rate_map, 'cat_prior': cat_prior,
        'dist_rate_map': dist_rate_map, 'dist_prior': dist_prior,
        'sub_rate_map': sub_rate_map, 'sub_prior': sub_prior,
        'cat_vol_map': cat_vol_map, 'dist_vol_map': dist_vol_map,
    }


def apply_hist_encoding(target_df, enc):
    target_df = target_df.copy()
    target_df['cat_breach_rate_hist'] = target_df['category_id'].map(enc['cat_rate_map']).fillna(enc['cat_prior'])
    target_df['dist_breach_rate_hist'] = target_df['district'].map(enc['dist_rate_map']).fillna(enc['dist_prior'])
    target_df['sub_breach_rate_hist'] = target_df['subcategory_id'].map(enc['sub_rate_map']).fillna(enc['sub_prior'])
    target_df['cat_volume'] = target_df['category_id'].map(enc['cat_vol_map']).fillna(0)
    target_df['dist_volume'] = target_df['district'].map(enc['dist_vol_map']).fillna(0)
    return target_df


def add_static_features(target_df):
    target_df = target_df.copy()
    target_df['sla_response_time_min'] = pd.to_numeric(target_df.get('sla_response_time_min'), errors='coerce')
    target_df['sla_resolution_time_min'] = pd.to_numeric(target_df.get('sla_resolution_time_min'), errors='coerce')
    target_df['has_sla_matrix'] = target_df['sla_resolution_time_min'].notna().astype(int)
    target_df['has_coordinates'] = (~target_df['latitude'].isna() & ~target_df['longitude'].isna()).astype(int)
    target_df['detail_len'] = target_df.get('detail', pd.Series('', index=target_df.index)).fillna('').str.len()
    return target_df


def add_time_features(target_df):
    target_df = target_df.copy()
    target_df['hour_of_day'] = target_df['created_at'].dt.hour
    target_df['day_of_week'] = target_df['created_at'].dt.dayofweek
    target_df['month_of_year'] = target_df['created_at'].dt.month
    target_df['is_weekend'] = (target_df['day_of_week'] >= 5).astype(int)
    target_df['is_working_hours'] = target_df['hour_of_day'].between(8, 17).astype(int)
    return target_df


def build_xy(target_df):
    m_df = target_df[ALL_FEATURES + [TARGET]].copy()
    m_df[TARGET] = m_df[TARGET].astype(int)
    for c in CAT_FEATURES:
        m_df[c] = m_df[c].fillna('UNKNOWN')
    return m_df[ALL_FEATURES], m_df[TARGET]


# ============================================================
# 4. Preprocessing + SMOTE
# ============================================================
def build_preprocessor():
    num_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])
    cat_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='UNKNOWN')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])
    return ColumnTransformer([
        ('num', num_transformer, NUM_FEATURES),
        ('cat', cat_transformer, CAT_FEATURES),
    ])


# ============================================================
# 5. Retrain loop — model selection by VALIDATION AUC only
# ============================================================
def build_models(round_idx, y_train):
    boost = round_idx
    lr = max(0.01, 0.05 - boost * 0.01)
    return {
        'Logistic Regression': LogisticRegression(max_iter=1000 + boost * 500, class_weight='balanced',
                                                    C=1.0 / (1 + boost * 0.3), random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=8 + boost * 2, class_weight='balanced', random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=200 + boost * 100, max_depth=10 + boost * 2,
                                                  class_weight='balanced', n_jobs=-1, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=200 + boost * 100, learning_rate=lr,
                                                          max_depth=5 + boost, random_state=42),
        'XGBoost': XGBClassifier(n_estimators=300 + boost * 150, learning_rate=lr, max_depth=6 + boost,
                                  eval_metric='logloss',
                                  scale_pos_weight=(y_train == 0).sum() / max((y_train == 1).sum(), 1),
                                  random_state=42, n_jobs=-1),
        'LightGBM': LGBMClassifier(n_estimators=300 + boost * 150, learning_rate=lr, max_depth=6 + boost,
                                    class_weight='balanced', random_state=42, n_jobs=-1, verbose=-1),
    }


def retrain_loop(X_train_res, y_train_res, X_val_proc, y_val):
    round_idx = 0
    passed = False
    results = {}
    best_model_name = None
    best = None

    while True:
        log(f'--- Retrain round {round_idx + 1}/{MAX_RETRAIN_ROUNDS} ---')
        models = build_models(round_idx, y_train_res)
        results = {}
        for name, model in models.items():
            model.fit(X_train_res, y_train_res)
            y_val_pred = model.predict(X_val_proc)
            y_val_proba = model.predict_proba(X_val_proc)[:, 1]
            results[name] = {
                'model': model,
                'val_accuracy': accuracy_score(y_val, y_val_pred),
                'val_roc_auc': roc_auc_score(y_val, y_val_proba),
                'val_avg_prec': average_precision_score(y_val, y_val_proba),
            }
            log(f'   {name:22s} | VAL AUC={results[name]["val_roc_auc"]:.4f}')

        best_model_name = max(results, key=lambda k: results[k]['val_roc_auc'])
        best = results[best_model_name]
        log(f'   Best this round: {best_model_name} (VAL AUC={best["val_roc_auc"]:.4f})')

        if best['val_roc_auc'] >= ACCEPT_ROC_AUC:
            passed = True
            log(f'   Passed VAL ROC-AUC >= {ACCEPT_ROC_AUC} -> stopping retrain loop')
            break

        round_idx += 1
        if round_idx >= MAX_RETRAIN_ROUNDS:
            log(f'   Reached {MAX_RETRAIN_ROUNDS} rounds without passing threshold -> using best found '
                f'(VAL AUC={best["val_roc_auc"]:.4f})')
            break
        log(f'   Below threshold ({best["val_roc_auc"]:.4f} < {ACCEPT_ROC_AUC}) -> retrying with stronger hyperparams')

    log(f'Selected model: {best_model_name} after {round_idx + 1} round(s), passed={passed}')
    return best_model_name, best, round_idx, passed


# ============================================================
# 6-8. Final eval + feature importance
# ============================================================
def final_evaluation(best_model_obj, X_test_proc, y_test):
    y_test_pred = best_model_obj.predict(X_test_proc)
    y_test_proba = best_model_obj.predict_proba(X_test_proc)[:, 1]
    return {
        'accuracy': accuracy_score(y_test, y_test_pred),
        'roc_auc': roc_auc_score(y_test, y_test_proba),
        'avg_prec': average_precision_score(y_test, y_test_proba),
    }


def compute_feature_importance(best_model_obj, preprocessor, results):
    num_feat_names = NUM_FEATURES
    try:
        cat_feat_names = list(preprocessor.named_transformers_['cat']
                               .named_steps['onehot'].get_feature_names_out(CAT_FEATURES))
    except Exception:
        cat_feat_names = []
    all_feat_names = num_feat_names + cat_feat_names

    if hasattr(best_model_obj, 'feature_importances_'):
        importances = best_model_obj.feature_importances_
        n = min(len(importances), len(all_feat_names))
        feat_imp_sorted = pd.Series(importances[:n], index=all_feat_names[:n]).sort_values(ascending=False)
    else:
        lr = results['Logistic Regression']['model']
        feat_imp_sorted = pd.Series(
            np.abs(lr.coef_[0])[:len(all_feat_names)],
            index=all_feat_names[:len(lr.coef_[0])]
        ).sort_values(ascending=False)

    feature_importance_json = [
        {"feature": describe_feature(name), "importance": round(float(val), 5)}
        for name, val in feat_imp_sorted.items()
    ]
    return feature_importance_json, all_feat_names


# ============================================================
# 9-10. Score open complaints + SHAP explanations
# ============================================================
def score_open_complaints(complaints, categories, subcategories, priority_lvl, sla_matrix,
                           reject_ids, enc, preprocessor, best_model_obj, all_feat_names):
    is_open = (
        complaints['resolved_at'].isna()
        & complaints['closed_at'].isna()
        & ~complaints['complaint_id'].isin(reject_ids)
    )
    df_open = complaints[is_open].copy()
    log(f'Open complaints to score: {len(df_open):,} of {len(complaints):,} total')

    df_open = clean_raw_data(df_open)

    if df_open.empty:
        return df_open, None, 0

    df_open = df_open.merge(categories[['category_id', 'category_name', 'category_code']], on='category_id', how='left')
    df_open = df_open.merge(subcategories[['subcategory_id', 'subcategory_name', 'subcategory_code']], on='subcategory_id', how='left')
    df_open = df_open.merge(priority_lvl[['priority_id', 'priority_name', 'priority_code', 'sla_response_time_min']],
                             on='priority_id', how='left')
    df_open = df_open.merge(sla_matrix[['subcategory_id', 'priority_id', 'sla_resolution_time_min']],
                             on=['subcategory_id', 'priority_id'], how='left')

    df_open = add_time_features(df_open)
    df_open = apply_hist_encoding(df_open, enc)
    df_open = add_static_features(df_open)

    X_open = df_open[ALL_FEATURES].copy()
    for c in CAT_FEATURES:
        X_open[c] = X_open[c].fillna('UNKNOWN')
    X_open_proc = preprocessor.transform(X_open)

    df_open['risk_prob'] = best_model_obj.predict_proba(X_open_proc)[:, 1]
    df_open['risk_tier'] = df_open['risk_prob'].apply(risk_tier)
    log('Risk tier distribution: ' + df_open['risk_tier'].value_counts().to_dict().__str__())

    # ---- SHAP top factors ----
    import shap
    n_feat = 0
    if hasattr(best_model_obj, 'feature_importances_'):
        explainer = shap.TreeExplainer(best_model_obj)
        shap_raw = explainer.shap_values(X_open_proc)
        if isinstance(shap_raw, list):
            shap_class1 = shap_raw[1]
        else:
            arr = np.asarray(shap_raw)
            shap_class1 = arr[:, :, 1] if arr.ndim == 3 else arr
    else:
        explainer = shap.LinearExplainer(best_model_obj, X_open_proc)
        shap_class1 = np.asarray(explainer.shap_values(X_open_proc))

    n_feat = min(shap_class1.shape[1], len(all_feat_names))

    def top_factors(row_shap, feat_names, top_n=TOP_N_FACTORS):
        idx = np.argsort(-np.abs(row_shap))[:top_n]
        return [{"factor": describe_feature(feat_names[i]), "impact": round(float(row_shap[i]), 4)} for i in idx]

    df_open['shap_top_factors'] = [
        json.dumps(top_factors(shap_class1[i][:n_feat], all_feat_names[:n_feat]), ensure_ascii=False)
        for i in range(len(df_open))
    ]

    return df_open, shap_class1, n_feat


# ============================================================
# 11. Save model artifact
# ============================================================
def save_artifact(best_model_obj, preprocessor, best_model_name, enc, final_test_metrics,
                   best, cutoff_date, round_idx, passed, feature_importance_json):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_version = f"v3_{best_model_name.lower().replace(' ', '_')}_{datetime.now():%Y%m%d}"

    artifact = {
        'model': best_model_obj,
        'preprocessor': preprocessor,
        'model_version': model_version,
        'model_name': best_model_name,
        'cat_features': CAT_FEATURES,
        'num_features': NUM_FEATURES,
        'all_features': ALL_FEATURES,
        'target': TARGET,
        'risk_tier_thresholds': {'HIGH': 0.7, 'MEDIUM': 0.4},
        'feature_importance': feature_importance_json,
        'historical_encoders': enc,
        'metrics': {
            'roc_auc': float(final_test_metrics['roc_auc']),
            'avg_prec': float(final_test_metrics['avg_prec']),
            'accuracy': float(final_test_metrics['accuracy']),
        },
        'validation_metrics_used_for_selection': {
            'roc_auc': float(best['val_roc_auc']),
            'avg_prec': float(best['val_avg_prec']),
            'accuracy': float(best['val_accuracy']),
        },
        'trained_at': datetime.now().isoformat(),
        'train_cutoff_date': str(cutoff_date),
        'retrain_rounds': round_idx + 1,
        'passed_threshold': passed,
        'accept_roc_auc': ACCEPT_ROC_AUC,
    }

    artifact_path = MODEL_DIR / f'{model_version}.joblib'
    joblib.dump(artifact, artifact_path)
    log(f'Saved model artifact: {artifact_path}')
    return model_version


# ============================================================
# 12. Write to DB
# ============================================================
def write_to_db(model_version, best_model_name, final_test_metrics, best, cutoff_date,
                 round_idx, passed, feature_importance_json, df_open):
    conn_pg = psycopg2.connect(DATABASE_URL)
    cur = conn_pg.cursor()

    try:
        # Safe, idempotent schema additions
        cur.execute("ALTER TABLE model_registry     ADD COLUMN IF NOT EXISTS feature_importance JSONB;")
        cur.execute("ALTER TABLE complaint_risk_log ADD COLUMN IF NOT EXISTS shap_top_factors   JSONB;")

        roc_auc_value = float(final_test_metrics['roc_auc'])
        pr_auc_value = float(final_test_metrics['avg_prec'])
        acc_value = float(final_test_metrics['accuracy'])

        cur.execute("SELECT model_version, roc_auc FROM model_registry WHERE status = 'active'")
        current_active = cur.fetchone()

        should_promote = (current_active is None) or (roc_auc_value > current_active[1])
        new_status = 'active' if should_promote else 'staging'

        retrain_notes = (
            f"retrain_rounds={round_idx + 1}/{MAX_RETRAIN_ROUNDS}; "
            f"passed_threshold(val)={passed}; accept_roc_auc(val)={ACCEPT_ROC_AUC}; "
            f"val_roc_auc={best['val_roc_auc']:.4f}; test_roc_auc={roc_auc_value:.4f}"
        )

        cur.execute("""
            INSERT INTO model_registry
                (model_version, model_name, target_variable, roc_auc, pr_auc, accuracy,
                 feature_list, feature_importance, train_cutoff_date, status, promoted_at, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (model_version) DO NOTHING
        """, (
            model_version, best_model_name, TARGET, roc_auc_value, pr_auc_value, acc_value,
            json.dumps(ALL_FEATURES),
            json.dumps(feature_importance_json, ensure_ascii=False),
            cutoff_date, new_status,
            datetime.now() if should_promote else None,
            retrain_notes,
        ))

        if should_promote and current_active:
            cur.execute(
                "UPDATE model_registry SET status = 'archived' WHERE status = 'active' AND model_version != %s",
                (model_version,)
            )

        if not df_open.empty:
            risk_rows = [
                (str(cid_), float(prob), str(tier), new_status, model_version, shap_json)
                for cid_, prob, tier, shap_json in
                df_open[['complaint_id', 'risk_prob', 'risk_tier', 'shap_top_factors']].itertuples(index=False, name=None)
            ]
            psycopg2.extras.execute_values(cur, """
                INSERT INTO complaint_risk_log
                    (complaint_id, risk_score, risk_tier, model_status, model_version, shap_top_factors)
                VALUES %s
                ON CONFLICT (complaint_id, model_version)
                DO UPDATE SET risk_score = EXCLUDED.risk_score,
                              risk_tier = EXCLUDED.risk_tier,
                              model_status = EXCLUDED.model_status,
                              shap_top_factors = EXCLUDED.shap_top_factors,
                              scored_at = now()
            """, risk_rows, template="(%s, %s, %s, %s, %s, %s)")
        else:
            risk_rows = []

        conn_pg.commit()

        if should_promote:
            prev = current_active[0] if current_active else "(none yet)"
            log(f'PROMOTED: {model_version} (test_auc={roc_auc_value:.4f}) > previous {prev} -> now active')
        else:
            log(f'Staging only: {model_version} (test_auc={roc_auc_value:.4f}) did not beat active '
                f'{current_active[0]} (test_auc={current_active[1]:.4f})')
        log(f'Wrote {len(risk_rows):,} rows to complaint_risk_log')

        return should_promote
    except Exception:
        conn_pg.rollback()
        raise
    finally:
        cur.close()
        conn_pg.close()


def notify_dashboard(model_version):
    if not DASHBOARD_REFRESH_API:
        log('DASHBOARD_REFRESH_API not set -> skipping refresh webhook')
        return
    try:
        res = requests.post(
            DASHBOARD_REFRESH_API,
            json={"model_version": model_version, "scored_at": datetime.now().isoformat()},
            timeout=10,
        )
        res.raise_for_status()
        log(f'Notified dashboard to refresh ({res.status_code})')
    except requests.RequestException as e:
        log(f'Could not reach dashboard refresh webhook: {e} (DB is already updated)')


# ============================================================
# Main
# ============================================================
def main():
    log('=== Starting complaint risk prediction training job ===')
    engine = create_engine(DATABASE_URL)

    dfs, v_sla = load_data(engine)
    df, reject_ids, categories, subcategories, priority_lvl, sla_matrix, complaints = build_labeled_df(dfs, v_sla)
    df = add_time_features(df)

    df_train, df_val, df_test, cutoff_date = temporal_split(df)

    enc = fit_historical_encoders(df_train)
    df_train = apply_hist_encoding(df_train, enc)
    df_val = apply_hist_encoding(df_val, enc)
    df_test = apply_hist_encoding(df_test, enc)

    df_train = add_static_features(df_train)
    df_val = add_static_features(df_val)
    df_test = add_static_features(df_test)

    X_train, y_train = build_xy(df_train)
    X_val, y_val = build_xy(df_val)
    X_test, y_test = build_xy(df_test)
    log(f'Breach rate — train={y_train.mean():.2%} val={y_val.mean():.2%} test={y_test.mean():.2%}')

    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)

    smote = SMOTE(random_state=42, k_neighbors=5)
    X_train_res, y_train_res = smote.fit_resample(X_train_proc, y_train)
    log(f'After SMOTE: {X_train_res.shape[0]:,} samples, positive rate={y_train_res.mean():.2%}')

    best_model_name, best, round_idx, passed = retrain_loop(X_train_res, y_train_res, X_val_proc, y_val)
    best_model_obj = best['model']

    final_test_metrics = final_evaluation(best_model_obj, X_test_proc, y_test)
    log(f'Final TEST metrics ({best_model_name}): ROC-AUC={final_test_metrics["roc_auc"]:.4f} '
        f'PR-AUC={final_test_metrics["avg_prec"]:.4f} Accuracy={final_test_metrics["accuracy"]:.4f}')

    results_for_importance = {best_model_name: {'model': best_model_obj}}
    feature_importance_json, all_feat_names = compute_feature_importance(best_model_obj, preprocessor, results_for_importance)

    df_open, shap_vals, n_feat = score_open_complaints(
        complaints, categories, subcategories, priority_lvl, sla_matrix,
        reject_ids, enc, preprocessor, best_model_obj, all_feat_names
    )

    model_version = save_artifact(
        best_model_obj, preprocessor, best_model_name, enc, final_test_metrics,
        best, cutoff_date, round_idx, passed, feature_importance_json
    )

    should_promote = write_to_db(
        model_version, best_model_name, final_test_metrics, best, cutoff_date,
        round_idx, passed, feature_importance_json, df_open
    )

    if should_promote:
        notify_dashboard(model_version)

    log('=== Job finished successfully ===')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f'❌ Job failed: {e}')
        raise
