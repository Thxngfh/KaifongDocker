"""
risk_features.py
=====================
ไฟล์กลาง (Single Source of Truth) สำหรับ logic ที่ต้องใช้ "เหมือนกันเป๊ะๆ"
ทั้งตอน train (train_risk_model.py), ตอน score เคสเดียว (score_new_complaint.py),
และตอน listener ฟัง event (listener.py)

ห้ามแก้สูตรพวกนี้ที่ไฟล์อื่น — แก้ที่นี่ที่เดียว แล้วทุกไฟล์ที่ import จะได้ผลตรงกันเสมอ
ย้ายมาจาก train_risk_model.py (ของเดิม) แบบ 1:1 ไม่มีการเปลี่ยน logic
"""

import pandas as pd

# ============================================================
# Config ที่ต้องใช้ร่วมกัน (feature list, target column, ป้ายภาษาไทย)
# ============================================================
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
    'day_of_week':             'วันที่แจ้งเรื่อง',
    'month_of_year':           'เดือนที่แจ้งเรื่อง',
    'is_weekend':              'แจ้งเรื่องช่วงวันหยุด',
    'is_working_hours':        'แจ้งเรื่องในเวลาทำการ',
    'cat_breach_rate_hist':    'อัตราเกิน SLA ของหมวดหมู่ปัญหา',
    'dist_breach_rate_hist':   'อัตราเกิน SLA ของพื้นที่',
    'sub_breach_rate_hist':    'อัตราเกิน SLA ของประเภทย่อย',
    'cat_volume':              'จำนวนเรื่องในหมวดหมู่ปัญหา',
    'dist_volume':             'จำนวนเรื่องในพื้นที่',
    'sla_response_time_min':   'SLA การตอบสนอง (นาที)',
    'sla_resolution_time_min': 'SLA การแก้ไข (นาที)',
    'has_sla_matrix':          'มีการกำหนด SLA',
    'has_coordinates':         'มีพิกัดตำแหน่ง',
    'detail_len':              'ความยาวของรายละเอียด',
}
CAT_LABEL_PREFIX = {
    'category_name':    'หมวดหมู่ปัญหา',
    'subcategory_name': 'ประเภทย่อย',
    'priority_code':    'ระดับความสำคัญ',
    'district':          'พื้นที่',
}


# ============================================================
# Helper functions (ย้ายมาแบบ 1:1 จาก train_risk_model.py เดิม)
# ============================================================
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


def add_time_features(target_df):
    target_df = target_df.copy()
    target_df['hour_of_day'] = target_df['created_at'].dt.hour
    target_df['day_of_week'] = target_df['created_at'].dt.dayofweek
    target_df['month_of_year'] = target_df['created_at'].dt.month
    target_df['is_weekend'] = (target_df['day_of_week'] >= 5).astype(int)
    target_df['is_working_hours'] = target_df['hour_of_day'].between(8, 17).astype(int)
    return target_df


def apply_hist_encoding(target_df, enc):
    """enc คือ dict ที่ได้จาก fit_historical_encoders() ตอน train
    (ถูกเก็บไว้ใน artifact['historical_encoders'] ตอน save_artifact แล้ว)"""
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


def build_xy(target_df):
    m_df = target_df[ALL_FEATURES + [TARGET]].copy()
    m_df[TARGET] = m_df[TARGET].astype(int)
    for c in CAT_FEATURES:
        m_df[c] = m_df[c].fillna('UNKNOWN')
    return m_df[ALL_FEATURES], m_df[TARGET]
