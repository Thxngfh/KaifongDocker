import os
from dotenv import load_dotenv

load_dotenv()

# =========================
# DATABASE (รอ connection string จากทีม DB)
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("ต้องตั้งค่า DATABASE_URL ใน environment variable ก่อนรัน")

# =========================
# LINE MESSAGING API (รอ token จริง)
# =========================
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
if not LINE_CHANNEL_ACCESS_TOKEN:
    raise RuntimeError("ต้องตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน environment variable ก่อนรัน")

LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"

# =========================
# SCORE THRESHOLDS (ตาม spec slide 23)
# =========================
SCORE_ACCEPT = 70
SCORE_REVIEW = 50
