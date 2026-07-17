import { NextResponse } from "next/server";
import pool from "@/lib/db";

// 🔁 แปลง status จาก DB → ภาษาไทยที่หน้าเว็บใช้
function mapStatus(code: string): string {
  switch (code) {
    case "PENDING":
      return "รอดำเนินการ";

    case "IN_PROGRESS":
      return "กำลังดำเนินการ";

    case "RESOLVED":
    case "CLOSED":
      return "เสร็จสิ้น";

    case "PAUSED":
      return "พักงาน";

    case "REJECTED":
      return "ถูกปฏิเสธ";

    default:
      return "รอดำเนินการ";
  }
}

export async function GET() {
  try {
    // 🧾 Query ดึงข้อมูลจาก DB
    const result = await pool.query(`
      SELECT
        c.complaint_id,
        c.complaint_no,
        cat.category_name AS title,
        ch.channel_name,
        u.display_name       AS person_name,
        u.phone_number       AS person_phone,
        st.status_code,
        staff.display_name   AS staff_name,
        cat.category_name
      FROM complaints c
      LEFT JOIN channels       ch    ON c.channel_id = ch.channel_id
      LEFT JOIN users          u     ON c.user_id = u.user_id
      LEFT JOIN status_master  st    ON c.current_status_id = st.status_id
      LEFT JOIN users          staff ON c.assigned_user_id = staff.user_id
      LEFT JOIN categories     cat   ON c.category_id = cat.category_id
      ORDER BY c.created_at DESC
      LIMIT 200
    `);

    // 🔄 map ให้ format ตรงกับ frontend
    const complaints = result.rows.map((row, i) => ({
      id: String(i + 1),
      complaintId: row.complaint_id,
      problems: row.complaint_no,
      app: row.channel_name ?? "Web",
      title: row.title ?? "-",
      person: row.person_name ?? "-",
      phone: row.person_phone ?? "-",
      status: mapStatus(row.status_code),
      staff: row.staff_name ?? "ยังไม่มอบหมาย",
      types: row.category_name ?? "-",
    }));

    // ✅ ส่ง JSON กลับไปให้ frontend
    return NextResponse.json(complaints);

  } catch (error: any) {
    console.error("DB ERROR (/api/evaluate):", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}