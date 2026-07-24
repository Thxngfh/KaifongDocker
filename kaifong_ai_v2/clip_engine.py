import logging
import os
import re
import sys
from typing import Optional

import torch
from PIL import Image
from sentence_transformers import SentenceTransformer, util

# กันเหนียวอีกชั้น: บังคับ stdout ไม่ให้ buffer ค้าง
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

# =========================
# ตั้ง logger สำหรับ debug output ของ Kaifong AI โดยเฉพาะ
# ใช้ logging.StreamHandler ไปที่ stderr เหมือนกับที่ uvicorn ใช้เอง
# (uvicorn log ที่เห็นขึ้นปกติอยู่แล้ว เช่น "INFO: Application startup complete."
#  ก็ไปทาง stderr เหมือนกัน — ใช้ช่องทางเดียวกันเพื่อการันตีว่าต้องขึ้นแน่นอน)
# นอกจากนี้ยังเขียนสำรองลงไฟล์ kaifong_debug.log ไว้อีกชั้น
# เผื่อ terminal มีปัญหาแปลกๆ ก็ยังเปิดไฟล์ดูผลย้อนหลังได้เสมอ
# =========================
kaifong_logger = logging.getLogger("kaifong_ai")
kaifong_logger.setLevel(logging.INFO)
kaifong_logger.propagate = False  # กันไม่ให้ print ซ้ำผ่าน root logger ของ uvicorn

if not kaifong_logger.handlers:
    _stream_handler = logging.StreamHandler(sys.stderr)
    _stream_handler.setFormatter(logging.Formatter("%(message)s"))
    kaifong_logger.addHandler(_stream_handler)

    _file_handler = logging.FileHandler("kaifong_debug.log", encoding="utf-8")
    _file_handler.setFormatter(logging.Formatter("%(message)s"))
    kaifong_logger.addHandler(_file_handler)

# =========================
# PII MASKING — ปิดเฉพาะข้อมูลที่เข้าข่าย PII ชัดเจน ส่วนที่เหลือของ description ยังอ่านได้ปกติ
#
# เบอร์โทร: จับด้วย pattern ตัวเลขได้แม่นยำสูง ไม่มีปัญหา false positive
#
# ชื่อคน: ตัดสินใจ mask เฉพาะกรณีมี "คำนำหน้าชื่อ" (นาย/นาง/นางสาว/คุณ/ด.ช./ด.ญ.)
# นำหน้าอยู่เท่านั้น แทนที่จะเดาว่า "คำไทย 2 คำติดกัน = ชื่อคน" (แบบที่เคยลองแล้วพัง —
# ไปทับข้อความปกติอย่าง "เสาไฟฟ้า ชำรุด" ด้วย) จับแค่ 1 คำถัดจากคำนำหน้าเท่านั้น
# (ไม่จับนามสกุลต่อท้าย) เพื่อกันไม่ให้ไปกินข้อความปกติที่ตามมาหลังชื่อ
# ข้อจำกัดที่ต้องรู้ไว้: ถ้า user พิมพ์ชื่อลอยๆ โดยไม่มีคำนำหน้า (เช่น "ณิชกานต์ สุขแพทย์"
# เฉยๆ ไม่มี "นางสาว" นำหน้า) หรือมีนามสกุลต่อท้ายชื่อ วิธีนี้จะจับไม่ครบ/ไม่ได้เลย —
# เป็นการยอมรับ trade-off เพื่อไม่ให้ข้อความปกติถูกเซนเซอร์ทับแบบผิดๆ
# ถ้าต้องการแม่นยำกว่านี้ ต้องใช้โมเดล NER ภาษาไทย (เช่น pythainlp) ซึ่งเพิ่ม
# dependency และความซับซ้อนในการติดตั้งขึ้นอีกระดับ
# =========================
PHONE_PATTERN = re.compile(r'0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}')
THAI_HONORIFIC_NAME_PATTERN = re.compile(
    r'(?:นางสาว|นาย|นาง|คุณ|ด\.ช\.|ด\.ญ\.)\s*[ก-๙]+'
)


def mask_pii_for_log(text: str) -> str:
    """
    ปิดเบอร์โทรและชื่อที่มีคำนำหน้าชัดเจน ก่อนเขียนลง log
    ส่วนที่เหลือของข้อความยังอ่านได้ปกติ เพื่อให้หลังบ้านยังเห็น context ของปัญหาได้
    """
    if not text:
        return text
    masked = PHONE_PATTERN.sub("[เบอร์โทร]", text)
    masked = THAI_HONORIFIC_NAME_PATTERN.sub("[ชื่อ]", masked)
    return masked


# =========================
# INIT MODEL (MULTILINGUAL — เข้าใจไทยตรงๆ, แม่นกว่าตัวเดิม)
# =========================
device = "cuda" if torch.cuda.is_available() else "cpu"

TEXT_MODEL_LOCAL_PATH = "./my_text_model_thai"
TEXT_MODEL_HF_NAME = "clip-ViT-B-32-multilingual-v1"  # แก้: เดิมโหลดจาก "./my_image_model" ผิดตัว

IMAGE_MODEL_LOCAL_PATH = "./my_image_model"
IMAGE_MODEL_HF_NAME = "clip-ViT-B-32"


def _load_or_download(local_path: str, hf_name: str) -> SentenceTransformer:
    """
    โหลดโมเดลจากเครื่อง (offline) ถ้ามีอยู่แล้ว
    ถ้ายังไม่มี ให้ดาวน์โหลดจาก HuggingFace มาครั้งเดียว แล้วเซฟไว้ใช้ครั้งต่อไป
    """
    if os.path.isdir(local_path):
        return SentenceTransformer(local_path, device=device)

    print(f"ไม่พบโมเดลในเครื่องที่ '{local_path}' — กำลังดาวน์โหลดจาก HuggingFace ครั้งแรก...")
    model = SentenceTransformer(hf_name, device=device)
    model.save(local_path)
    print(f"เซฟโมเดลลงเครื่องที่ '{local_path}' สำเร็จแล้ว (ครั้งต่อไปจะโหลดจากเครื่องโดยไม่ต่อเน็ต)")
    return model


text_model = _load_or_download(TEXT_MODEL_LOCAL_PATH, TEXT_MODEL_HF_NAME)
img_model = _load_or_download(IMAGE_MODEL_LOCAL_PATH, IMAGE_MODEL_HF_NAME)

# =========================
# LABELS ภาษาไทย พร้อม mapping ไปยัง (category, subcategory)
# =========================
LABELS_TH = [
    "ไฟถนนเสีย", "เสาไฟฟ้า", "สายไฟชำรุด", "หม้อแปลงไฟฟ้า",
    "ถนนชำรุด", "ถนนเป็นหลุม", "ทางเท้าชำรุด",
    "ระบบระบายน้ำ", "น้ำท่วมท่อระบายน้ำ", "ท่อน้ำรั่ว", "ประปา",
    "อาคารชำรุด", "สะพานชำรุด",
    "กองขยะ", "ถังขยะล้น", "พื้นที่สาธารณะสกปรก",
    "สวนสาธารณะ", "พื้นที่สีเขียว", "สัตว์รบกวน",
    "ควันมลพิษทางอากาศ", "เสียงรบกวน", "น้ำเสียรั่วไหล",
    "รถติด", "จอดรถผิดกฎหมาย", "หาบเร่แผงลอย", "ป้ายโฆษณาผิดกฎหมาย", "สัตว์จรจัด",
    "กิจกรรมชุมชน", "ศูนย์ดูแลผู้สูงอายุ", "ศูนย์เด็กเล็ก",
    "สำนักงานราชการ", "เคาน์เตอร์บริการประชาชน"
]

LABEL_MAP = {
    "ไฟถนนเสีย":       ("INFRA", "INFRA_LIGHT"),
    "เสาไฟฟ้า":         ("INFRA", "INFRA_LIGHT"),
    "สายไฟชำรุด":       ("INFRA", "INFRA_LIGHT"),
    "หม้อแปลงไฟฟ้า":    ("INFRA", "INFRA_LIGHT"),
    "ถนนชำรุด":         ("INFRA", "INFRA_ROAD"),
    "ถนนเป็นหลุม":      ("INFRA", "INFRA_ROAD"),
    "ทางเท้าชำรุด":     ("INFRA", "INFRA_ROAD"),
    "ระบบระบายน้ำ":         ("INFRA", "INFRA_DRAIN"),
    "น้ำท่วมท่อระบายน้ำ":   ("INFRA", "INFRA_DRAIN"),
    "ท่อน้ำรั่ว":           ("INFRA", "INFRA_DRAIN"),
    "ประปา":               ("INFRA", "INFRA_DRAIN"),
    "อาคารชำรุด":       ("INFRA", "INFRA_BUILDING"),
    "สะพานชำรุด":       ("INFRA", "INFRA_BUILDING"),
    "กองขยะ":              ("ENV", "ENV_WASTE"),
    "ถังขยะล้น":           ("ENV", "ENV_WASTE"),
    "พื้นที่สาธารณะสกปรก": ("ENV", "ENV_CLEAN"),
    "สวนสาธารณะ":          ("ENV", "ENV_GREEN"),
    "พื้นที่สีเขียว":      ("ENV", "ENV_GREEN"),
    "สัตว์รบกวน":          ("ENV", "ENV_ANIMAL"),
    "ควันมลพิษทางอากาศ": ("HEALTH", "HEALTH_POLLUTION"),
    "เสียงรบกวน":         ("HEALTH", "HEALTH_NOISE"),
    "น้ำเสียรั่วไหล":     ("HEALTH", "HEALTH_POLLUTION"),
    "รถติด":               ("ORDER", "ORDER_TRAFFIC"),
    "จอดรถผิดกฎหมาย":     ("ORDER", "ORDER_TRAFFIC"),
    "หาบเร่แผงลอย":       ("ORDER", "ORDER_VENDOR"),
    "ป้ายโฆษณาผิดกฎหมาย": ("ORDER", "ORDER_SIGN"),
    "สัตว์จรจัด":          ("ORDER", "ORDER_STRAY"),
    "กิจกรรมชุมชน":       ("SOCIAL", "SOCIAL_COMMUNITY"),
    "ศูนย์ดูแลผู้สูงอายุ": ("SOCIAL", "SOCIAL_WELFARE"),
    "ศูนย์เด็กเล็ก":       ("SOCIAL", "SOCIAL_CHILD"),
    "สำนักงานราชการ":         ("GOV", "GOV_SERVICE"),
    "เคาน์เตอร์บริการประชาชน": ("GOV", "GOV_SERVICE"),
}

SUBCATEGORY_KEYWORDS = {
    "INFRA_LIGHT": [
        "ไฟ", "ไฟฟ้า", "ไฟดับ", "ไฟไม่ติด", "ไฟกะพริบ", "เสาไฟ", "เสาไฟฟ้า", "สายไฟ",
        "หม้อแปลง", "ไฟช็อต", "ไฟลัดวงจร", "ไฟฟ้าลัดวงจร", "ลัดวงจร", "ช็อต", "ประกายไฟ",
        "ไฟรั่ว", "ไฟไหม้", "ไฟกระชาก", "เสาล้ม", "สายไฟขาด",
    ],
    "INFRA_ROAD": [
        "ถนน", "ถนนพัง", "ถนนทรุด", "หลุม", "หลุมบ่อ", "พื้นยุบ", "ยางมะตอย",
        "ทางเท้า", "ฟุตบาท", "กระเบื้องแตก", "พื้นแตก",
    ],
    "INFRA_DRAIN": [
        "น้ำรั่ว", "ท่อน้ำ", "ประปา", "ท่อแตก", "น้ำไม่ไหล",
        "ท่อระบายน้ำ", "ฝาท่อ", "รางระบายน้ำ", "น้ำท่วม", "น้ำขัง",
    ],
    "INFRA_BUILDING": [
        "กำแพง", "อาคาร", "สะพาน", "ป้าย", "โครงสร้าง", "ระเบิด", "ตึกร้าว", "อาคารทรุด",
    ],
    "ENV_WASTE": ["ขยะ", "กองขยะ", "ขยะล้น", "ขยะตกค้าง", "เศษขยะ", "กลิ่นขยะ", "ถังขยะ"],
    "ENV_GREEN": ["ต้นไม้", "กิ่งไม้", "ต้นไม้ล้ม", "หญ้ารก", "สวนสาธารณะ", "พื้นที่สีเขียว"],
    "ENV_CLEAN": ["สกปรก", "กลิ่นเหม็น", "เหม็น", "พื้นที่สาธารณะสกปรก"],
    "ENV_ANIMAL": ["ซากสัตว์", "สัตว์ตาย", "สุนัขตาย", "แมวตาย"],
    "HEALTH_POLLUTION": ["ควัน", "ฝุ่น", "pm2.5", "มลพิษ", "อากาศเสีย", "น้ำเสีย", "น้ำเน่า", "น้ำเหม็น", "ปล่อยน้ำเสีย", "น้ำเสียรั่วไหล"],
    "HEALTH_NOISE": ["เสียงดัง", "เสียงรบกวน", "เสียงเครื่องจักร", "เปิดเพลงดัง"],
    "HEALTH_DISEASE": ["เชื้อโรค", "ยุง", "ลูกน้ำ", "โรคระบาด", "ไข้เลือดออก"],
    "HEALTH_FOOD": ["อาหารไม่สะอาด", "อาหารเน่า", "ร้านอาหารสกปรก"],
    "ORDER_TRAFFIC": ["จราจร", "รถติด", "รถจอด", "จอดขวาง", "จอดกีดขวาง", "จอดในที่ห้ามจอด", "กีดขวาง"],
    "ORDER_VENDOR": ["แผงลอย", "หาบเร่", "หาบเร่แผงลอย"],
    "ORDER_SIGN": ["ป้ายโฆษณา", "ป้ายผิดกฎหมาย", "ป้ายรุกล้ำ"],
    "ORDER_STRAY": ["สัตว์จรจัด", "สัตว์รบกวน", "สุนัข", "หมาจร", "แมวจร", "หนู", "แมลงวัน"],
    "SOCIAL_COMMUNITY": ["กิจกรรมชุมชน", "ชุมชน"],
    "SOCIAL_WELFARE": ["ผู้สูงอายุ", "คนพิการ", "สวัสดิการ", "เบี้ยยังชีพ"],
    "SOCIAL_CHILD": ["เด็ก", "ศูนย์เด็กเล็ก"],
    "SOCIAL_JOB": ["อาชีพ", "รายได้", "ตกงาน"],
    "GOV_SERVICE": ["เจ้าหน้าที่", "บริการ", "บริการล่าช้า", "สำนักงานราชการ", "เคาน์เตอร์บริการประชาชน"],
    "GOV_DIGITAL": ["เว็บไซต์", "แอปพลิเคชัน", "ดิจิทัล", "ระบบล่ม"],
    "GOV_TRANSPARENCY": ["ความโปร่งใส", "ทุจริต", "คอร์รัปชัน"],
    "GOV_FEEDBACK": [],
}

SUBCATEGORY_TO_CATEGORY = {
    "INFRA_LIGHT": "INFRA", "INFRA_ROAD": "INFRA", "INFRA_DRAIN": "INFRA", "INFRA_BUILDING": "INFRA",
    "ENV_WASTE": "ENV", "ENV_GREEN": "ENV", "ENV_CLEAN": "ENV", "ENV_ANIMAL": "ENV",
    "HEALTH_POLLUTION": "HEALTH", "HEALTH_NOISE": "HEALTH", "HEALTH_DISEASE": "HEALTH", "HEALTH_FOOD": "HEALTH",
    "ORDER_TRAFFIC": "ORDER", "ORDER_VENDOR": "ORDER", "ORDER_SIGN": "ORDER", "ORDER_STRAY": "ORDER",
    "SOCIAL_COMMUNITY": "SOCIAL", "SOCIAL_WELFARE": "SOCIAL", "SOCIAL_CHILD": "SOCIAL", "SOCIAL_JOB": "SOCIAL",
    "GOV_SERVICE": "GOV", "GOV_DIGITAL": "GOV", "GOV_TRANSPARENCY": "GOV", "GOV_FEEDBACK": "GOV",
}

CATEGORY_KEYWORDS: dict = {}
for _subcat, _keywords in SUBCATEGORY_KEYWORDS.items():
    _cat = SUBCATEGORY_TO_CATEGORY[_subcat]
    CATEGORY_KEYWORDS.setdefault(_cat, [])
    CATEGORY_KEYWORDS[_cat].extend(_keywords)

LABEL_EMBEDDINGS = text_model.encode(LABELS_TH, convert_to_tensor=True)


def predict_image(image_path: str):
    image = Image.open(image_path).convert("RGB")
    image_embedding = img_model.encode(image, convert_to_tensor=True)
    cos_scores = util.cos_sim(image_embedding, LABEL_EMBEDDINGS)[0]
    top3 = torch.topk(cos_scores, k=3)
    best_idx = top3.indices[0].item()
    best_label = LABELS_TH[best_idx]
    raw_score = top3.values[0].item()
    confidence = float(max(0, min((raw_score + 1) / 2 * 100, 100)))
    category, subcategory = LABEL_MAP.get(best_label, ("UNKNOWN", "UNKNOWN"))
    return {"label": best_label, "confidence": round(confidence, 2), "category": category, "subcategory": subcategory}


SUBCATEGORY_OVERRIDE_MIN_MATCHES = 2
KEYWORD_OVERRIDE_MIN_MATCHES = 2


def subcategory_keyword_scores(description: str) -> dict:
    scores = {}
    for subcat, keywords in SUBCATEGORY_KEYWORDS.items():
        matched = [k for k in keywords if k in description]
        if matched:
            scores[subcat] = len(matched)
    return scores


def keyword_category_scores(description: str) -> dict:
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matched = [k for k in keywords if k in description]
        if matched:
            scores[cat] = len(matched)
    return scores


def _predict_within_indices(text_embedding, restricted_indices):
    restricted_embeddings = LABEL_EMBEDDINGS[restricted_indices]
    cos_scores = util.cos_sim(text_embedding, restricted_embeddings)[0]
    best_local_idx = torch.argmax(cos_scores).item()
    best_idx = restricted_indices[best_local_idx]
    best_label = LABELS_TH[best_idx]
    raw_score = cos_scores[best_local_idx].item()
    confidence = float(max(0, min((raw_score + 1) / 2 * 100, 100)))
    category, subcategory = LABEL_MAP.get(best_label, ("UNKNOWN", "UNKNOWN"))
    return best_label, confidence, category, subcategory


def predict_category_from_text(description: str):
    text_embedding = text_model.encode(description, convert_to_tensor=True)

    subcat_scores = subcategory_keyword_scores(description)
    dominant_subcat = max(subcat_scores, key=subcat_scores.get) if subcat_scores else None
    dominant_subcat_count = subcat_scores.get(dominant_subcat, 0) if dominant_subcat else 0

    if dominant_subcat and dominant_subcat_count >= SUBCATEGORY_OVERRIDE_MIN_MATCHES:
        target_category = SUBCATEGORY_TO_CATEGORY[dominant_subcat]
        restricted_indices = [
            i for i, label in enumerate(LABELS_TH)
            if LABEL_MAP.get(label, ("UNKNOWN", "UNKNOWN")) == (target_category, dominant_subcat)
        ]
        if restricted_indices:
            best_label, confidence, category, subcategory = _predict_within_indices(text_embedding, restricted_indices)
            return {
                "label": best_label, "confidence": round(confidence, 2),
                "category": category, "subcategory": subcategory,
                "keyword_adjusted": True, "keyword_level": "subcategory",
                "keyword_matches": dominant_subcat_count,
            }

    kw_scores = keyword_category_scores(description)
    dominant_kw_category = max(kw_scores, key=kw_scores.get) if kw_scores else None
    dominant_kw_count = kw_scores.get(dominant_kw_category, 0) if dominant_kw_category else 0

    if dominant_kw_category and dominant_kw_count >= KEYWORD_OVERRIDE_MIN_MATCHES:
        restricted_indices = [
            i for i, label in enumerate(LABELS_TH)
            if LABEL_MAP.get(label, ("UNKNOWN", "UNKNOWN"))[0] == dominant_kw_category
        ]
        if restricted_indices:
            best_label, confidence, category, subcategory = _predict_within_indices(text_embedding, restricted_indices)
            return {
                "label": best_label, "confidence": round(confidence, 2),
                "category": category, "subcategory": subcategory,
                "keyword_adjusted": True, "keyword_level": "category",
                "keyword_matches": dominant_kw_count,
            }

    cos_scores = util.cos_sim(text_embedding, LABEL_EMBEDDINGS)[0]
    top3 = torch.topk(cos_scores, k=3)
    best_idx = top3.indices[0].item()
    best_label = LABELS_TH[best_idx]
    raw_score = top3.values[0].item()
    confidence = float(max(0, min((raw_score + 1) / 2 * 100, 100)))
    category, subcategory = LABEL_MAP.get(best_label, ("UNKNOWN", "UNKNOWN"))

    return {
        "label": best_label, "confidence": round(confidence, 2),
        "category": category, "subcategory": subcategory,
        "keyword_adjusted": False, "keyword_level": None, "keyword_matches": 0,
    }


def image_category_score(selected_category, selected_subcategory, ai_category, ai_subcategory, confidence: float) -> float:
    conf_ratio = max(0, min(confidence / 100, 1))
    if selected_category == ai_category and selected_subcategory == ai_subcategory:
        boosted_ratio = conf_ratio ** 0.5
        return round(boosted_ratio * 40, 2)
    if selected_category == ai_category:
        return round(conf_ratio * 40 * 0.35, 2)
    return round(conf_ratio * 40 * 0.10, 2)


def description_category_score(category: str, description: str):
    keywords = CATEGORY_KEYWORDS.get(category, [])
    if not keywords:
        return 0, []
    matched = [k for k in keywords if k in description]
    match_count = len(matched)
    if match_count >= 3:
        score = 20
    elif match_count == 2:
        score = 16
    elif match_count == 1:
        score = 12
    else:
        score = 0
    return score, matched


def image_text_score(image_path: str, description: str) -> float:
    image = Image.open(image_path).convert("RGB")
    image_embedding = img_model.encode(image, convert_to_tensor=True)
    candidates = [description, "เรื่องที่ไม่เกี่ยวข้องกับปัญหาสาธารณะใดๆ"]
    text_embeddings = text_model.encode(candidates, convert_to_tensor=True)
    cos_scores = util.cos_sim(image_embedding, text_embeddings)[0]
    probs = torch.softmax(cos_scores * 20, dim=0)
    score = float(probs[0].item())
    return round(score * 100, 2)


def image_description_score(image_path: str, description: str) -> float:
    raw = image_text_score(image_path, description)
    return round(raw * 0.40, 2)


LOW_CONFIDENCE_THRESHOLD = 30


def determine_decision(selected_category: str, selected_subcategory: Optional[str], nlp_result: dict, img_result: dict):
    if selected_subcategory:
        agree_user_nlp = (selected_category == nlp_result["category"] and selected_subcategory == nlp_result["subcategory"])
        agree_user_img = (selected_category == img_result["category"] and selected_subcategory == img_result["subcategory"])
        agree_nlp_img = (nlp_result["category"] == img_result["category"] and nlp_result["subcategory"] == img_result["subcategory"])
    else:
        agree_user_nlp = (selected_category == nlp_result["category"])
        agree_user_img = (selected_category == img_result["category"])
        agree_nlp_img = (nlp_result["category"] == img_result["category"])

    agreement_count = sum([agree_user_nlp, agree_user_img, agree_nlp_img])
    both_low_confidence = (nlp_result["confidence"] < LOW_CONFIDENCE_THRESHOLD and img_result["confidence"] < LOW_CONFIDENCE_THRESHOLD)

    if agree_user_nlp and agree_user_img:
        return {
            "decision": "ACCEPT",
            "reason": "หมวดที่ผู้ใช้เลือก, ข้อความ (NLP), และรูปภาพ ตรงกันทั้งหมด — มั่นใจสูงสุด",
            "suggested_category": None, "suggested_subcategory": None, "agreement_count": agreement_count,
        }

    if both_low_confidence:
        return {
            "decision": "REJECT",
            "reason": "ทั้งข้อความและรูปภาพมีความมั่นใจต่ำมาก ไม่สอดคล้องกับหมวดใดเลย — น่าจะไม่ใช่เรื่องจริง",
            "suggested_category": None, "suggested_subcategory": None, "agreement_count": agreement_count,
        }

    if agree_nlp_img and not (agree_user_nlp and agree_user_img):
        return {
            "decision": "REVIEW",
            "reason": ("ข้อความ (NLP) และรูปภาพตรงกัน แต่ไม่ตรงกับหมวดที่ผู้ใช้เลือก "
                       "— น่าจะเป็นกรณีผู้ใช้เลือกหมวดผิด ไม่ใช่เรื่องปลอม แนะนำให้เจ้าหน้าที่ยืนยันและแก้หมวดให้"),
            "suggested_category": nlp_result["category"], "suggested_subcategory": nlp_result["subcategory"],
            "agreement_count": agreement_count,
        }

    return {
        "decision": "REVIEW",
        "reason": "หมวดที่ผู้ใช้เลือก, ข้อความ, และรูปภาพ ไม่สอดคล้องกันชัดเจน ให้เจ้าหน้าที่ตรวจสอบก่อนตัดสินใจ",
        "suggested_category": None, "suggested_subcategory": None, "agreement_count": agreement_count,
    }


def calculate_score(category: str, description: str, image_path: str, subcategory: Optional[str] = None, debug: bool = True):
    ai_result = predict_image(image_path)
    nlp_result = predict_category_from_text(description)

    if subcategory:
        img_cat_score = image_category_score(category, subcategory, ai_result["category"], ai_result["subcategory"], ai_result["confidence"])
    else:
        conf_ratio = max(0, min(ai_result["confidence"] / 100, 1))
        if category == ai_result["category"]:
            img_cat_score = round((conf_ratio ** 0.5) * 40, 2)
        else:
            img_cat_score = round(conf_ratio * 40 * 0.15, 2)

    desc_score, matched_keywords = description_category_score(category, description)
    img_text_score = image_description_score(image_path, description)

    total = round(img_cat_score + desc_score + img_text_score, 2)
    total = max(0, min(total, 100))

    decision_result = determine_decision(category, subcategory, nlp_result, ai_result)
    decision = decision_result["decision"]

    overall_confidence = round(nlp_result["confidence"] * 0.6 + ai_result["confidence"] * 0.4, 2)
    possible_category_mismatch = (decision == "REVIEW" and decision_result["suggested_category"] is not None)

    if debug:
        # ใช้ logger แทน print ธรรมดา — ไปช่องทางเดียวกับ log ของ uvicorn (stderr)
        # + เขียนสำรองลงไฟล์ kaifong_debug.log ด้วย
        # PII MASKING: ปิดเบอร์โทรและชื่อที่มีคำนำหน้าชัดเจนก่อนเขียนลง log
        # ส่วนที่เหลือของข้อความยังอ่านได้ปกติ (ดูข้อจำกัดของวิธีนี้ที่ comment ด้านบน)
        # การคำนวณจริงด้านบนยังใช้ description ตัวเต็มตามปกติ ผลลัพธ์ AI ไม่เปลี่ยน
        safe_description = mask_pii_for_log(description)

        def _log(msg: str = ""):
            kaifong_logger.info(msg)

        _log("=" * 55)
        _log("🚂 KAIFONG AI SCORE ENGINE")
        _log("=" * 55)
        _log(f"📂 Category    : {category}" + (f" / {subcategory}" if subcategory else ""))
        _log(f"📝 Description : {safe_description}")
        _log()
        _log("🔍 NLP ANALYSIS (จากข้อความ)")
        _log(f"   Predicted   : {nlp_result['category']} / {nlp_result['subcategory']}")
        _log(f"   Confidence  : {nlp_result['confidence']:.2f}")
        if nlp_result.get("keyword_adjusted"):
            _level_th = "ระดับ subcategory (ละเอียดสุด)" if nlp_result.get("keyword_level") == "subcategory" else "ระดับ category ใหญ่"
            _log(f"   🔧 ปรับโดย Keyword ({nlp_result['keyword_matches']} คำตรง, {_level_th})")
        _log()
        _log("🖼️  IMAGE ANALYSIS (จากรูปภาพ)")
        _log(f"   Predicted   : {ai_result['category']} / {ai_result['subcategory']}")
        _log(f"   Confidence  : {ai_result['confidence']:.2f}")
        _log(f"   Keywords    : {', '.join(matched_keywords) if matched_keywords else '-'}")
        _log()
        _log("📊 SCORE BREAKDOWN")
        _log(f"   Description : {desc_score:.2f} / 20")
        _log(f"   Image       : {img_cat_score:.2f} / 40")
        _log(f"   Image-Text  : {img_text_score:.2f} / 40")
        _log()
        _log("🏆 RESULT")
        _log(f"   TOTAL SCORE : {total:.2f} / 100")
        _log(f"   OVERALL CONF: {overall_confidence:.2f}")
        _log(f"   DECISION    : {decision}")
        if possible_category_mismatch:
            _log(f"   ⚠️  น่าจะเลือกหมวดผิด แนะนำ: {decision_result['suggested_category']} / {decision_result['suggested_subcategory']}")
        _log("=" * 55 + "\n")

    return {
        "decision": decision,
        "score": total,
        "overall_confidence": overall_confidence,
        "reason": decision_result["reason"],
        "mismatch": {
            "detected": possible_category_mismatch,
            "suggested_category": decision_result["suggested_category"],
            "suggested_subcategory": decision_result["suggested_subcategory"],
        },
        "details": {
            "nlp": {
                "category": nlp_result["category"], "subcategory": nlp_result["subcategory"],
                "confidence": nlp_result["confidence"],
                "keyword_adjusted": nlp_result.get("keyword_adjusted", False),
                "keyword_level": nlp_result.get("keyword_level"),
            },
            "image": {
                "category": ai_result["category"], "subcategory": ai_result["subcategory"],
                "confidence": ai_result["confidence"],
            },
            "score_breakdown": {"description": desc_score, "image": img_cat_score, "image_text": img_text_score},
            "matched_keywords": matched_keywords,
            "category_agreement_count": decision_result["agreement_count"],
        },
    }