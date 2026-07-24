import psycopg2
import psycopg2.extras
from config import DATABASE_URL

# =========================
# CATEGORY_CODE -> TEAM_CODE
# team_code ตั้งชื่อให้ตรงกับ category_code (ดู seed data จากทีม DB)
# teams ไม่มี FK ตรงไปยัง categories ใน schema จริง จึง map ผ่านชื่อ
# =========================
CATEGORY_TO_TEAM_CODE = {
    "INFRA": "TEAM_INFRA",
    "ENV": "TEAM_ENV",
    "HEALTH": "TEAM_HEALTH",
    "ORDER": "TEAM_ORDER",
    "SOCIAL": "TEAM_SOCIAL",
    "GOV": "TEAM_GOV",
}


def get_connection():
    """
    เชื่อมต่อ Postgres
    ต้องเสียบ DATABASE_URL จริงใน config.py หรือ .env ก่อนใช้งานจริง
    """
    return psycopg2.connect(DATABASE_URL)


def get_category_id(category_code: str, tenant_id: str):
    """
    complaints.category_id เป็น uuid (ไม่ใช่ string code)
    ต้องแปลง category_code ('INFRA') -> category_id (uuid) ก่อนเขียนลง DB เสมอ
    """
    query = """
        SELECT category_id
        FROM categories
        WHERE category_code = %s
          AND tenant_id = %s
          AND is_active = TRUE
        LIMIT 1
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (category_code, tenant_id))
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def get_status_id(status_code: str, tenant_id: str):
    """
    workflow_logs.to_status_id ก็เป็น uuid อ้างอิง status_master
    ใช้แปลง status_code ('IN_PROGRESS') -> status_id (uuid)
    """
    query = """
        SELECT status_id
        FROM status_master
        WHERE status_code = %s
          AND tenant_id = %s
        LIMIT 1
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (status_code, tenant_id))
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def get_team_by_category(category_code: str, tenant_id: str):
    """
    หาช่าง (OFFICER) ที่อยู่ในทีมที่รับผิดชอบ category นี้
    team ผูกกับ category ผ่านชื่อ team_code (ไม่มี FK ตรงใน schema จริง)
    เลือกเฉพาะ role_in_team = 'OFFICER' (คนหน้างาน ไม่ใช่ SUPERVISOR)
    """
    team_code = CATEGORY_TO_TEAM_CODE.get(category_code)
    if not team_code:
        return None

    query = """
        SELECT
            u.user_id,
            u.display_name,
            u.line_user_id,
            t.team_id,
            t.team_name
        FROM teams t
        JOIN team_members tm ON tm.team_id = t.team_id
        JOIN users u ON u.user_id = tm.user_id
        WHERE t.team_code = %s
          AND t.tenant_id = %s
          AND tm.role_in_team = 'OFFICER'
          AND tm.is_active = TRUE
          AND u.is_active = TRUE
        ORDER BY RANDOM()
        LIMIT 1
    """

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, (team_code, tenant_id))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def assign_complaint_to_team(complaint_id: str, team_user_id: str, team_id: str, tenant_id: str):
    """
    1) อัปเดต complaints.assigned_user_id / assigned_team_id / current_status_id
    2) insert workflow_logs (action_type='ASSIGNED' บังคับต้องมี assigned_team_id ตาม CHECK constraint จริง)
    ทำเป็น transaction เดียวกัน ถ้าพังให้ rollback ทั้งคู่
    """
    status_id = get_status_id("IN_PROGRESS", tenant_id)

    update_query = """
        UPDATE complaints
        SET assigned_user_id = %s,
            assigned_team_id = %s,
            current_status_id = %s,
            updated_at = NOW()
        WHERE complaint_id = %s
    """

    log_query = """
        INSERT INTO workflow_logs
            (complaint_id, to_status_id, action_type, assigned_team_id, assigned_user, action_note)
        VALUES (%s, %s, 'ASSIGNED', %s, %s, 'มอบหมายงานอัตโนมัติโดย AI Score Engine')
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(update_query, (team_user_id, team_id, status_id, complaint_id))
            cur.execute(log_query, (complaint_id, status_id, team_id, team_user_id))
        conn.commit()
    finally:
        conn.close()


def save_ai_analysis(complaint_id: str, category_id, confidence_score: float,
                      recommendation: str, model_version: str = "kaifong-clip-multilingual-v1"):
    """
    บันทึกผลการวิเคราะห์ของ AI ลงตาราง ai_analysis ที่ schema มีไว้ให้แล้ว
    """
    query = """
        INSERT INTO ai_analysis
            (complaint_id, model_version, category_id, confidence_score, recommendation, analyzed_by)
        VALUES (%s, %s, %s, %s, %s, 'AI_SYSTEM')
        RETURNING analysis_id
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (complaint_id, model_version, category_id, confidence_score, recommendation))
            analysis_id = cur.fetchone()[0]
        conn.commit()
        return analysis_id
    finally:
        conn.close()


def save_ai_keywords(complaint_id: str, analysis_id: str, keywords: list):
    """
    บันทึก keyword ที่ AI เจอใน description ลงตาราง ai_keywords
    """
    if not keywords:
        return

    query = """
        INSERT INTO ai_keywords (complaint_id, analysis_id, keyword, weight)
        VALUES (%s, %s, %s, %s)
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for kw in keywords:
                cur.execute(query, (complaint_id, analysis_id, kw, 1.0))
        conn.commit()
    finally:
        conn.close()
