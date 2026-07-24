import requests
from config import LINE_CHANNEL_ACCESS_TOKEN, LINE_PUSH_URL


def notify_technician(line_user_id: str, complaint_no: str, category_th: str, description: str, score: float):
    """
    ส่ง LINE push message แจ้งช่างที่ถูก assign งานเข้ามาใหม่
    🔧 ต้องเสียบ LINE_CHANNEL_ACCESS_TOKEN จริงใน config.py หรือ .env ก่อนใช้งานจริง
    """

    if not line_user_id:
        print("⚠️ ไม่มี line_user_id ของช่าง — ข้ามการแจ้งเตือน")
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}"
    }

    message_text = (
        f"🔧 มีงานใหม่มอบหมายให้คุณ\n\n"
        f"เลขที่คำร้อง: {complaint_no}\n"
        f"ประเภท: {category_th}\n"
        f"รายละเอียด: {description}\n"
        f"คะแนนความน่าเชื่อถือ: {score:.2f}/100\n\n"
        f"กรุณาตรวจสอบรายละเอียดในระบบ KaifongAI"
    )

    payload = {
        "to": line_user_id,
        "messages": [
            {
                "type": "text",
                "text": message_text
            }
        ]
    }

    try:
        response = requests.post(LINE_PUSH_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        print(f"✅ แจ้งช่างสำเร็จ: {line_user_id}")
        return response.json() if response.text else {"status": "ok"}
    except requests.exceptions.RequestException as e:
        print(f"❌ แจ้งช่างไม่สำเร็จ: {e}")
        return None
