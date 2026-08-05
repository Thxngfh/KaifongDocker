"""
test_data_validation.py
=====================
ทดสอบว่า validation จับข้อมูลผิดปกติได้จริง โดยจำลอง 5 สถานการณ์:
  1. ข้อมูลปกติ -> ต้องผ่าน
  2. แถวน้อยเกินไป -> ต้องถูกจับ
  3. complaint_id ซ้ำ -> ต้องถูกจับ
  4. พิกัด lat/lon หลุดขอบเขตประเทศไทย -> ต้องถูกจับ
  5. breach rate เป็น 0% ทั้งหมด (degenerate label) -> ต้องถูกจับ
  6. join พังบางส่วน (category_name หายเกินเกณฑ์) -> ต้องถูกจับ

รัน: python3 test_data_validation.py
"""
import pandas as pd
import numpy as np
from data_validation import (
    validate_raw_complaints, validate_labeled_df, DataValidationError,
)

def make_good_raw(n=100):
    return pd.DataFrame({
        "complaint_id": range(1, n + 1),
        "created_at": pd.date_range("2026-01-01", periods=n, freq="h"),
        "district": np.random.choice(["บางรัก", "ปทุมวัน", "ดินแดง"], n),
        "latitude": np.random.uniform(13.6, 13.9, n),
        "longitude": np.random.uniform(100.4, 100.7, n),
    })

def make_good_labeled(n=100):
    return pd.DataFrame({
        "complaint_id": range(1, n + 1),
        "sla_breached": np.random.choice([0, 1], n, p=[0.7, 0.3]),
        "category_name": np.random.choice(["ถนน", "น้ำท่วม", "แสงสว่าง"], n),
        "subcategory_name": np.random.choice(["ย่อย1", "ย่อย2"], n),
    })

def run_case(name, fn):
    print(f"\n{'='*60}\nกรณีทดสอบ: {name}\n{'='*60}")
    try:
        result = fn()
        print(f"✅ ผ่าน validation: {result}")
    except DataValidationError as e:
        print(f"❌ ถูกจับโดย validation (ตามที่คาดหวัง):\n{e}")


if __name__ == "__main__":
    # 1. ข้อมูลปกติ -> ต้องผ่าน
    run_case("1. ข้อมูลดิบปกติ", lambda: validate_raw_complaints(make_good_raw(), "DEMO"))
    run_case("1b. ข้อมูล labeled ปกติ", lambda: validate_labeled_df(make_good_labeled(), "DEMO"))

    # 2. แถวน้อยเกินไป
    run_case("2. ข้อมูลดิบมีแค่ 5 แถว (ต่ำกว่าเกณฑ์)", lambda: validate_raw_complaints(make_good_raw(5), "DEMO"))

    # 3. complaint_id ซ้ำ
    def case3():
        df = make_good_raw()
        df.loc[1, "complaint_id"] = df.loc[0, "complaint_id"]  # บังคับให้ซ้ำ
        return validate_raw_complaints(df, "DEMO")
    run_case("3. complaint_id ซ้ำกัน", case3)

    # 4. พิกัดหลุดขอบเขตประเทศไทย (จำลอง bug เช่น latitude/longitude สลับกัน)
    def case4():
        df = make_good_raw()
        df.loc[0, "latitude"] = 100.5   # หลุดขอบเขต lat ของไทย (5-21)
        return validate_raw_complaints(df, "DEMO")
    run_case("4. พิกัด latitude ผิดปกติ (หลุดขอบเขตประเทศไทย)", case4)

    # 5. breach rate 0% ทั้งหมด (degenerate label)
    def case5():
        df = make_good_labeled()
        df["sla_breached"] = 0   # จำลองว่า v_complaint_sla คำนวณผิดจนไม่มีเคสเกิน SLA เลย
        return validate_labeled_df(df, "DEMO")
    run_case("5. อัตราเกิน SLA เป็น 0% ทั้งชุดข้อมูล", case5)

    # 6. join พังบางส่วน (category_name หายเกิน 20%)
    def case6():
        df = make_good_labeled()
        df.loc[df.index[:40], "category_name"] = None   # จำลอง join ไม่ตรง 40% ของข้อมูล
        return validate_labeled_df(df, "DEMO")
    run_case("6. category_name หายเกินเกณฑ์ (join พังบางส่วน)", case6)
