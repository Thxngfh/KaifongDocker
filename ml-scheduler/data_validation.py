"""
data_validation.py
=====================
Data validation layer — ตรวจสอบคุณภาพข้อมูลก่อนเข้าสู่ pipeline การเทรนโมเดล
เช็ค 2 จุด (สอดคล้องกับลำดับใน run_for_tenant()):

  1. validate_raw_complaints()  -> เช็คทันทีหลัง load_data() (ก่อนแตะ business logic ใดๆ)
  2. validate_labeled_df()      -> เช็คทันทีหลัง build_labeled_df() (ก่อน temporal_split)

หลักการ: ถ้าข้อมูล "ผิดปกติจนไม่ควรเอาไปเทรน" ให้ raise DataValidationError ทันที
ซึ่ง main() ที่มีอยู่แล้วจะจับ exception นี้เป็นราย tenant อยู่แล้ว (ไม่ต้องแก้ error handling เพิ่ม)
-> tenant นี้แค่ถูก skip รอบนี้ ไม่กระทบ tenant อื่น (เหมือนพฤติกรรม error อื่นๆ ที่มีอยู่แล้ว)
"""

import pandera.pandas as pa
from pandera.pandas import Column, Check, DataFrameSchema

MIN_ROWS_RAW = 30          # อย่างน้อยต้องมีกี่แถวถึงจะเทรนได้อย่างมีความหมาย
MIN_ROWS_LABELED = 30      # อย่างน้อยหลัง join/label แล้วต้องมีกี่แถว
MAX_NULL_RATIO_JOIN = 0.20 # คอลัมน์ที่มาจาก join ห้าม null เกินสัดส่วนนี้ (บอกว่า join พังบางส่วน)

# ขอบเขตพิกัดของประเทศไทยแบบกว้างๆ (ใช้ตรวจจับพิกัดหลุด เช่น (0,0) หรือพิมพ์ผิดคีย์)
TH_LAT_RANGE = (5.0, 21.0)
TH_LON_RANGE = (97.0, 106.0)


class DataValidationError(Exception):
    """ข้อมูลไม่ผ่านเกณฑ์คุณภาพที่กำหนด — ห้ามนำไปเทรนต่อ"""
    pass


# ============================================================
# จุดที่ 1: เช็คข้อมูลดิบทันทีหลัง load_data()
# ============================================================
raw_complaints_schema = DataFrameSchema(
    {
        "complaint_id": Column(checks=Check(lambda s: s.notna().all()), nullable=False),
        "created_at": Column(checks=Check(lambda s: s.notna().all()), nullable=False),
        "district": Column(nullable=True),
        "latitude": Column(
            checks=Check.in_range(*TH_LAT_RANGE, include_min=True, include_max=True),
            nullable=True,
        ),
        "longitude": Column(
            checks=Check.in_range(*TH_LON_RANGE, include_min=True, include_max=True),
            nullable=True,
        ),
    },
    strict=False,   # อนุญาตให้มีคอลัมน์อื่นเพิ่มเติมได้ ไม่ error แค่เพราะ schema ไม่ตรงเป๊ะ
    coerce=False,
)


def validate_raw_complaints(df, tenant_code):
    """เรียกทันทีหลัง load_data() ก่อนแตะ business logic ใดๆ"""
    n = len(df)
    if n < MIN_ROWS_RAW:
        raise DataValidationError(
            f"[{tenant_code}] ข้อมูล complaints มีแค่ {n} แถว (ต่ำกว่าเกณฑ์ขั้นต่ำ {MIN_ROWS_RAW} แถว) "
            f"-> ข้ามรอบนี้ไปก่อน เทรนด้วยข้อมูลน้อยเกินไปจะได้โมเดลที่ไม่น่าเชื่อถือ"
        )

    dup = df["complaint_id"].duplicated().sum()
    if dup > 0:
        raise DataValidationError(
            f"[{tenant_code}] พบ complaint_id ซ้ำ {dup} รายการ -> น่าจะมีปัญหาที่ query หรือต้นทางข้อมูล"
        )

    try:
        raw_complaints_schema.validate(df, lazy=True)
    except pa.errors.SchemaErrors as e:
        # lazy=True รวบ error ทั้งหมดไว้ใน e.failure_cases แทนที่จะพังตัวแรกแล้วหยุด
        raise DataValidationError(
            f"[{tenant_code}] ข้อมูล complaints ไม่ผ่าน schema validation:\n{e.failure_cases.to_string()}"
        )


# ============================================================
# จุดที่ 2: เช็คข้อมูลหลัง build_labeled_df() (หลัง join + สร้าง label แล้ว)
# ============================================================
def validate_labeled_df(df, tenant_code):
    """เรียกทันทีหลัง build_labeled_df() ก่อนเข้า temporal_split()
    เช็คสิ่งที่ schema-level เช็คไม่ได้ (ต้องดูภาพรวมทั้งชุดข้อมูล ไม่ใช่ทีละแถว)"""

    n = len(df)
    if n < MIN_ROWS_LABELED:
        raise DataValidationError(
            f"[{tenant_code}] หลัง join/label แล้วเหลือแค่ {n} แถว (ต่ำกว่าเกณฑ์ {MIN_ROWS_LABELED}) "
            f"-> อาจเกิดจาก join กับ categories/subcategories/sla_matrix ไม่ตรง ทำให้แถวหลุดไปเยอะ"
        )

    # เช็คว่า label เป็น 0/1 เท่านั้น (ไม่มีค่าเพี้ยนหลุดมา)
    invalid_labels = ~df["sla_breached"].isin([0, 1])
    if invalid_labels.any():
        raise DataValidationError(
            f"[{tenant_code}] พบค่า sla_breached ที่ไม่ใช่ 0/1 จำนวน {invalid_labels.sum()} แถว"
        )

    # เช็คว่า label ไม่ degenerate (ไม่ใช่ 0% หรือ 100% ทั้งหมด)
    breach_rate = df["sla_breached"].mean()
    if breach_rate == 0 or breach_rate == 1:
        raise DataValidationError(
            f"[{tenant_code}] อัตราการเกิน SLA เท่ากับ {breach_rate:.0%} ทั้งชุดข้อมูล "
            f"(ควรมีทั้งเคสเกินและไม่เกินปนกัน) -> น่าจะมี bug ที่ต้นทาง (เช่น v_complaint_sla คำนวณผิด) "
            f"ไม่ใช่ความผันผวนทางธุรกิจตามปกติ"
        )

    # เช็ค join integrity: ถ้า category_name/subcategory_name null เกินสัดส่วนที่ยอมรับได้
    # แปลว่า join กับตาราง categories/subcategories น่าจะพังบางส่วน (category_id ไม่ตรงกัน)
    for col in ["category_name", "subcategory_name"]:
        if col not in df.columns:
            continue
        null_ratio = df[col].isna().mean()
        if null_ratio > MAX_NULL_RATIO_JOIN:
            raise DataValidationError(
                f"[{tenant_code}] คอลัมน์ {col} เป็นค่าว่าง {null_ratio:.1%} ของข้อมูลทั้งหมด "
                f"(เกินเกณฑ์ {MAX_NULL_RATIO_JOIN:.0%}) -> น่าจะเป็นปัญหาการ join กับตารางอ้างอิง ไม่ใช่ข้อมูลหายตามธรรมชาติ"
            )

    log_summary = (
        f"[{tenant_code}] Data validation ผ่าน — {n:,} แถว, breach rate={breach_rate:.1%}, "
        f"null(category_name)={df['category_name'].isna().mean():.1%}, "
        f"null(subcategory_name)={df['subcategory_name'].isna().mean():.1%}"
    )
    return log_summary
