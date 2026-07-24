from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

from clip_engine import calculate_score
from db import (
    get_category_id,
    get_team_by_category,
    assign_complaint_to_team,
    save_ai_analysis,
    save_ai_keywords,
)
from line_notifier import notify_technician
from security import AuditTimer, verify_api_key  # เพิ่ม: API Key auth + audit log

app = FastAPI()

# =========================
# CORS
# อ่านรายชื่อ origin ที่อนุญาตจาก environment variable ALLOWED_ORIGINS
# รูปแบบ: คั่นด้วย comma เช่น "https://your-liff-domain.com,http://localhost:8000"
# ตั้งค่าใน Railway dashboard (Variables tab) หรือไฟล์ .env ตอน dev
# ถ้าไม่ตั้งค่าไว้เลย จะ fallback เป็น localhost อย่างเดียว (ปลอดภัยไว้ก่อน)
# =========================
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000")
ALLOWED_ORIGINS = [origin.strip() for origin in _origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# tenant_id ของเทศบาลนครปากเกร็ด (ตาม seed data จากทีม DB)
DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"

CATEGORY_TH = {
    "INFRA": "โครงสร้างพื้นฐานและสาธารณูปโภค",
    "ENV": "สิ่งแวดล้อมและสุขาภิบาล",
    "HEALTH": "สาธารณสุขและมลพิษ",
    "ORDER": "ความเป็นระเบียบเรียบร้อยและจราจร",
    "SOCIAL": "สวัสดิการสังคมและพัฒนาชุมชน",
    "GOV": "การบริการเจ้าหน้าที่และธรรมาภิบาล"
}

# กลับทาง: ภาษาไทยเต็ม -> code (ใช้ตอนรับข้อมูลจาก user/LIFF ที่ส่งมาเป็นไทย)
TH_TO_CATEGORY = {v: k for k, v in CATEGORY_TH.items()}


# =========================
# SUBCATEGORY ภาษาไทย -> code
# ตามชื่อจริงที่ปรากฏใน dropdown ของหน้า LIFF (ดูจากภาพหน้าจอที่ทีม frontend ทำไว้)
# ต้องตรงกับ subcategory_name ใน DB เป๊ะ ไม่งั้น match ไม่ติด
# =========================
SUBCATEGORY_TH_TO_CODE = {
    # INFRA
    "ถนนและทางเท้า": "INFRA_ROAD",
    "ไฟฟ้าสาธารณะ": "INFRA_LIGHT",
    "การระบายน้ำ": "INFRA_DRAIN",
    "อาคารและสิ่งก่อสร้าง": "INFRA_BUILDING",
    # ENV
    "การจัดการขยะ": "ENV_WASTE",
    "พื้นที่สีเขียว": "ENV_GREEN",
    "ความสะอาดทั่วไป": "ENV_CLEAN",
    "ซากสัตว์": "ENV_ANIMAL",
    # HEALTH
    "มลพิษทางเสียง": "HEALTH_NOISE",
    "มลพิษทางอากาศและน้ำ": "HEALTH_POLLUTION",
    "การควบคุมโรค": "HEALTH_DISEASE",
    "อาหารและตลาด": "HEALTH_FOOD",
    # ORDER
    "การจราจรและที่จอดรถ": "ORDER_TRAFFIC",
    "หาบเร่แผงลอย": "ORDER_VENDOR",
    "สัตว์จรจัด": "ORDER_STRAY",
    "ป้ายผิดกฎหมาย": "ORDER_SIGN",
    # SOCIAL
    "เบี้ยยังชีพและสวัสดิการ": "SOCIAL_WELFARE",
    "ศูนย์พัฒนาเด็กเล็ก": "SOCIAL_CHILD",
    "กิจกรรมชุมชน": "SOCIAL_COMMUNITY",
    "อาชีพและรายได้": "SOCIAL_JOB",
    # GOV
    "การบริการภาครัฐ": "GOV_SERVICE",
    "บริการดิจิทัล": "GOV_DIGITAL",
    "ความโปร่งใส": "GOV_TRANSPARENCY",
    "ข้อเสนอแนะทั่วไป": "GOV_FEEDBACK",
}


def resolve_category_code(category_input: str) -> str:
    """
    รับ category ที่ user ส่งมา ไม่ว่าจะเป็น code (INFRA) หรือภาษาไทยเต็ม
    (โครงสร้างพื้นฐานและสาธารณูปโภค) แล้วคืนค่าเป็น code เสมอ
    เพื่อให้ calculate_score และ DB query ทำงานถูกต้อง
    """
    category_input = category_input.strip()

    if category_input in CATEGORY_TH:
        return category_input

    if category_input in TH_TO_CATEGORY:
        return TH_TO_CATEGORY[category_input]

    return category_input


def resolve_subcategory_code(subcategory_input):
    """
    รับ subcategory ที่ user ส่งมา ไม่ว่าจะเป็น code (INFRA_LIGHT) หรือภาษาไทยเต็ม
    (ไฟฟ้าสาธารณะ) จากฟอร์ม LIFF dropdown แล้วคืนค่าเป็น code เสมอ
    ฟอร์มจริงส่งมาเป็นภาษาไทย ('ไฟฟ้าสาธารณะ') ไม่ใช่ code โดยตรง
    """
    if not subcategory_input:
        return None

    subcategory_input = subcategory_input.strip()

    # ถ้าเป็น code อยู่แล้ว (ขึ้นต้นด้วย category code + underscore เช่น INFRA_LIGHT)
    if subcategory_input in SUBCATEGORY_TH_TO_CODE.values():
        return subcategory_input

    # ถ้าเป็นภาษาไทย แปลงเป็น code
    if subcategory_input in SUBCATEGORY_TH_TO_CODE:
        return SUBCATEGORY_TH_TO_CODE[subcategory_input]

    return subcategory_input


# =========================
# แก้จุดที่ 3 (โค้ดซ้ำ): รวม logic เซฟไฟล์ชั่วคราว + resolve category/subcategory
# + คำนวณคะแนน ไว้ในฟังก์ชันเดียว ให้ /verify-image และ /test-score เรียกใช้ร่วมกัน
# แก้จุดที่ 2 (ไฟล์ค้าง): ใช้ try/finally ลบไฟล์ทิ้งเสมอ ไม่ว่าจะสำเร็จหรือ error
# =========================
async def save_temp_image_and_score(category: str, subcategory, description: str, image: UploadFile):
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    temp_filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, temp_filename)

    with open(path, "wb") as f:
        f.write(await image.read())

    try:
        resolved_category = resolve_category_code(category)
        resolved_subcategory = resolve_subcategory_code(subcategory)

        result = calculate_score(resolved_category, description, path, subcategory=resolved_subcategory)

        return resolved_category, resolved_subcategory, result
    finally:
        # ลบไฟล์ชั่วคราวทิ้งเสมอ ไม่ว่าคำนวณสำเร็จหรือ error กันโฟลเดอร์ uploads บวม
        if os.path.exists(path):
            os.remove(path)


@app.get("/")
def home():
    return {"message": "Kaifong AI Service Running"}


@app.post("/verify-image")
async def verify_image(
    request: Request,
    complaint_id: str = Form(...),   # เลขที่คำร้องจาก DB (ทีม backend สร้างไว้ก่อนแล้ว)
    complaint_no: str = Form(...),   # เลขที่อ้างอิงแบบที่ user เห็น เช่น REQ-001
    category: str = Form(...),       # รับได้ทั้ง code (INFRA) และภาษาไทยเต็ม
    subcategory: str = Form(None),   # รับได้ทั้ง code และภาษาไทย (ไฟฟ้าสาธารณะ) จาก dropdown จริง
    description: str = Form(...),
    tenant_id: str = Form(DEFAULT_TENANT_ID),
    image: UploadFile = File(...),
    auth: dict = Depends(verify_api_key),   # แก้จุดที่ 1: ต้องแนบ X-API-Key ก่อนเข้าถึง endpoint นี้
):
    with AuditTimer("/verify-image", request, auth) as audit:
        category, subcategory, result = await save_temp_image_and_score(
            category, subcategory, description, image
        )

        response = {
            "complaint_id": complaint_id,
            "complaint_no": complaint_no,
            "category": category,
            "category_th": CATEGORY_TH.get(category, category),
            "subcategory": subcategory,
            "description": description,
            **result,
            "assigned_to": None
        }

        # แปลง category_code -> category_id (uuid) เพราะ complaints/ai_analysis ใช้ uuid
        category_id = get_category_id(category, tenant_id)

        # บันทึกผล AI ลง ai_analysis + ai_keywords เสมอ ไม่ว่าผลจะ ACCEPT/REVIEW/REJECT
        if category_id:
            recommendation = (
                f"คะแนนรวม {result['score']:.2f}/100 ({result['decision']}) - "
                f"AI ทำนาย category: {result['details']['image']['category']} / "
                f"{result['details']['image']['subcategory']}"
            )
            analysis_id = save_ai_analysis(
                complaint_id=complaint_id,
                category_id=category_id,
                confidence_score=result["details"]["image"]["confidence"],
                recommendation=recommendation
            )
            save_ai_keywords(complaint_id, analysis_id, result["details"]["matched_keywords"])
        else:
            print(f"ไม่พบ category_id สำหรับ code: {category} (tenant: {tenant_id})")

        # ถ้า ACCEPT -> auto-assign ช่างตาม category + แจ้ง LINE
        if result["decision"] == "ACCEPT":
            team = get_team_by_category(category, tenant_id)

            if team:
                assign_complaint_to_team(
                    complaint_id=complaint_id,
                    team_user_id=team["user_id"],
                    team_id=team["team_id"],
                    tenant_id=tenant_id
                )

                notify_technician(
                    line_user_id=team["line_user_id"],
                    complaint_no=complaint_no,
                    category_th=CATEGORY_TH.get(category, category),
                    description=description,
                    score=result["score"]
                )

                response["assigned_to"] = {
                    "user_id": team["user_id"],
                    "display_name": team["display_name"],
                    "team_name": team["team_name"]
                }
            else:
                print(f"ไม่พบช่างสำหรับ category: {category}")

        audit.set_result({
            "decision": result["decision"],
            "score": result["score"],
            "complaint_no": complaint_no,
        })

        return response


# =========================
# TEST ENDPOINT — ทดสอบ AI score engine อย่างเดียว ไม่แตะ database
# รับ category/subcategory ได้ทั้ง code และภาษาไทย เหมือน /verify-image
# =========================
@app.post("/test-score")
async def test_score(
    request: Request,
    category: str = Form(...),
    subcategory: str = Form(None),
    description: str = Form(...),
    image: UploadFile = File(...),
    auth: dict = Depends(verify_api_key),   # แก้จุดที่ 1: ต้องแนบ X-API-Key ก่อนเข้าถึง endpoint นี้ด้วยเช่นกัน
):
    with AuditTimer("/test-score", request, auth) as audit:
        category, subcategory, result = await save_temp_image_and_score(
            category, subcategory, description, image
        )

        audit.set_result({"decision": result["decision"], "score": result["score"]})

        return {
            "category": category,
            "category_th": CATEGORY_TH.get(category, category),
            "subcategory": subcategory,
            "description": description,
            **result
        }