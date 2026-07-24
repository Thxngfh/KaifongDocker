"""
security.py
- API Key authentication (เก็บ key แบบ hashed ไม่เก็บ plaintext)
- Audit logging: บันทึกทุก request ว่าใคร เรียกอะไร เมื่อไหร่ ผลลัพธ์อะไร
  เก็บเป็นไฟล์ JSON Lines (audit.log) บนเครื่องเดียวกัน ไม่ส่งออกไปที่ไหน

การจัดการ API Key:
- Key จริงเก็บใน environment variable หรือไฟล์ api_keys.json (เก็บเป็น hash)
- ห้าม hard-code key ลงในโค้ด และห้าม commit ไฟล์ api_keys.json ขึ้น git
"""

import hashlib
import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Header, HTTPException, Request

# ==========================================================
# ค่าตั้งต้น — ปรับ path ตามจริงตอน deploy
# ==========================================================
API_KEYS_FILE = os.environ.get("API_KEYS_FILE", "./api_keys.json")
AUDIT_LOG_FILE = os.environ.get("AUDIT_LOG_FILE", "./audit.log")


def hash_key(raw_key: str) -> str:
    """แฮช API key ด้วย SHA-256 ก่อนเทียบ/เก็บ (ไม่เก็บ plaintext)"""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def load_api_keys() -> dict:
    """
    โหลดรายการ API key ที่อนุญาต จากไฟล์ JSON
    รูปแบบไฟล์ api_keys.json:
    {
        "<sha256-hash-of-key>": {"owner": "ทีม A", "active": true}
    }
    """
    path = Path(API_KEYS_FILE)
    if not path.exists():
        # ถ้ายังไม่มีไฟล์ ให้สร้าง key เริ่มต้นแบบสุ่ม แล้วแจ้งเตือนใน log
        default_key = uuid.uuid4().hex
        default_hash = hash_key(default_key)
        path.write_text(
            json.dumps({default_hash: {"owner": "default", "active": True}}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print("=" * 60)
        print("⚠️  ยังไม่มีไฟล์ api_keys.json — สร้าง API Key เริ่มต้นให้แล้ว")
        print(f"    API KEY (เก็บไว้ให้ดี ไม่แสดงซ้ำอีก): {default_key}")
        print("=" * 60)
        return json.loads(path.read_text(encoding="utf-8"))

    return json.loads(path.read_text(encoding="utf-8"))


_API_KEYS_CACHE = None


def get_api_keys() -> dict:
    global _API_KEYS_CACHE
    if _API_KEYS_CACHE is None:
        _API_KEYS_CACHE = load_api_keys()
    return _API_KEYS_CACHE


def reload_api_keys():
    """เรียกใช้ถ้าต้องการ refresh key list โดยไม่ต้อง restart service"""
    global _API_KEYS_CACHE
    _API_KEYS_CACHE = load_api_keys()


async def verify_api_key(x_api_key: str = Header(None, alias="X-API-Key")) -> dict:
    """
    FastAPI dependency สำหรับตรวจสอบ API Key
    ใช้งาน: def endpoint(auth: dict = Depends(verify_api_key))
    """

    # โหลด/สร้าง api_keys.json ก่อนเสมอ
    keys = get_api_keys()

    # ตรวจว่ามีการส่ง API Key มาหรือไม่
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="ต้องแนบ X-API-Key header"
        )

    # ตรวจสอบ API Key
    key_hash = hash_key(x_api_key)
    entry = keys.get(key_hash)

    if entry is None:
        raise HTTPException(
            status_code=403,
            detail="API Key ไม่ถูกต้อง"
        )

    if not entry.get("active", False):
        raise HTTPException(
            status_code=403,
            detail="API Key ถูกระงับ"
        )

    return {
        "owner": entry.get("owner", "unknown"),
        "key_hash": key_hash[:12],
    }

# ==========================================================
# Audit Logging
# ==========================================================

def write_audit_log(
    endpoint: str,
    owner: str,
    key_hash_prefix: str,
    client_ip: str,
    status_code: int,
    duration_ms: float,
    result_summary: dict | None = None,
):
    """
    บันทึก audit log เป็น JSON Lines (1 บรรทัด = 1 request)
    เก็บเฉพาะ metadata และผลลัพธ์สรุป ไม่เก็บข้อมูลดิบ (เช่นไม่เก็บรูปภาพ หรือข้อความเต็มของผู้ใช้)
    เพื่อลดความเสี่ยงข้อมูลอ่อนไหวสะสมอยู่ใน log
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoint": endpoint,
        "owner": owner,
        "api_key_prefix": key_hash_prefix,
        "client_ip": client_ip,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "result_summary": result_summary or {},
    }
    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


class AuditTimer:
    """Context manager ช่วยจับเวลาและเขียน audit log อัตโนมัติ"""

    def __init__(self, endpoint: str, request: Request, auth: dict):
        self.endpoint = endpoint
        self.client_ip = request.client.host if request.client else "unknown"
        self.owner = auth.get("owner", "unknown")
        self.key_hash_prefix = auth.get("key_hash", "unknown")
        self.status_code = 200
        self.result_summary = {}

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def set_result(self, result_summary: dict, status_code: int = 200):
        self.result_summary = result_summary
        self.status_code = status_code

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.perf_counter() - self._start) * 1000
        if exc_type is not None:
            self.status_code = getattr(exc_val, "status_code", 500)
            self.result_summary = {"error": str(exc_val)}
        write_audit_log(
            endpoint=self.endpoint,
            owner=self.owner,
            key_hash_prefix=self.key_hash_prefix,
            client_ip=self.client_ip,
            status_code=self.status_code,
            duration_ms=duration_ms,
            result_summary=self.result_summary,
        )
        return False  # ไม่กลืน exception ปล่อยให้ FastAPI จัดการ error ต่อ