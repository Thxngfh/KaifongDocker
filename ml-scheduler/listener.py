"""
listener.py
=====================
Process ที่นั่งฟัง Postgres NOTIFY ตลอดเวลา (ไม่ใช่ cron)
พอมี complaint ใหม่ -> score ทันทีด้วย model ที่ active อยู่ (ผ่าน score_new_complaint.py)
รันเป็น container แยกจาก ml-scheduler (cron) เพราะต้อง "ตื่นฟัง" 24/7 ไม่ใช่ sleep รอ 7 วัน
"""
import os
import select
import json
import time

import psycopg2
import pandas as pd
from sqlalchemy import create_engine

from score_new_complaint import score_one, write_result

DATABASE_URL = os.environ.get("DATABASE_URL", "")
CHANNEL = "new_complaint_channel"


def log(msg):
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] {msg}", flush=True)


def get_tenant_code(engine, tenant_id):
    row = pd.read_sql("SELECT tenant_code FROM tenants WHERE tenant_id=%(t)s", engine, params={"t": tenant_id})
    return row.iloc[0]['tenant_code'] if not row.empty else None


def handle_notify(payload, engine):
    data = json.loads(payload)
    complaint_id = data['complaint_id']
    tenant_id = data['tenant_id']
    log(f"ได้รับ event complaint ใหม่: complaint_id={complaint_id} tenant_id={tenant_id}")

    tenant_code = get_tenant_code(engine, tenant_id)
    if not tenant_code:
        log(f"❌ หา tenant_code ไม่เจอ (tenant_id={tenant_id}) -> ข้าม")
        return

    try:
        result = score_one(complaint_id, tenant_id, tenant_code, engine)
        write_result(result, tenant_id)
        log(f"✅ Scored complaint_id={complaint_id} -> risk_tier={result['risk_tier']} "
            f"(score={result['risk_score']}, model={result['model_version']})")
    except Exception as e:
        # เคสเดียวพังไม่ควรทำให้ listener ตายทั้งตัว — batch รายสัปดาห์จะมาช่วยเก็บทีหลังอยู่ดี
        log(f"❌ Score ไม่สำเร็จ complaint_id={complaint_id}: {e}")


def run():
    log("=== Listener starting, waiting for new complaints... ===")
    engine = create_engine(DATABASE_URL)

    conn = psycopg2.connect(DATABASE_URL)
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute(f"LISTEN {CHANNEL};")
    log(f"LISTEN {CHANNEL} — พร้อมรับ event แล้ว")

    while True:
        if select.select([conn], [], [], 30) == ([], [], []):
            continue  # timeout เฉยๆ วนกลับไปเช็ค connection ใหม่

        conn.poll()
        while conn.notifies:
            notify = conn.notifies.pop(0)
            handle_notify(notify.payload, engine)


if __name__ == "__main__":
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL ไม่ได้ตั้งค่า")
    while True:
        try:
            run()
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            log(f"⚠️ DB connection หลุด: {e} — retry ใน 5 วิ")
            time.sleep(5)
        except Exception as e:
            log(f"⚠️ Listener error ไม่คาดคิด: {e} — restart loop ใน 5 วิ")
            time.sleep(5)
