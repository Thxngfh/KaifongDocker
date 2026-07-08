/*
// app/api/form/submit/route.ts
import { NextRequest, NextResponse } from "next/server"
//ตอนกด submit จะลงข้อมุลที่ได้จากฟอร์ม เข้าระบบ
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log("Form Data:", body)

        return NextResponse.json({ ok: true, data: body }) 
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

//insert ข้อมุล เข้าตาราง user, compaints, workload, complaint_file

//ต้องเก็บข้อมุลลงตาราง user ก่อน จะมีหลักๆนะ user_line_id titlename firstname lastname phone  
//พอได้แล้วมันจะดึง userId จาก last (ส่วนตารางที่ใส่ไปอันล่าสุดที่เชื่อมกับ user_line_id ที่ user login เข้ามา)

//ให้เอา userId มาใส่ใน ตาราง complaint 
//แล้วให้เอา complaintId ใส่เข้า workflow complaint_file ต่อไป
*/

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/iron-session-config";

// ค่าคงที่จริงจาก DB (เช็คแล้วในขั้นตอนก่อนหน้า)
const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const CHANNEL_LINE_LIFF_ID = "cccc0001-0000-0000-0000-000000000001";
const STATUS_PENDING_ID = "ffff0000-0000-0000-0000-000000000001";

function generateComplaintNo(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `CMP-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn || !session.userId || !session.lineUserId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const body = await req.json();
    const { user, complaint, files } = body;

    await client.query("BEGIN");

    // 1. อัปเดตข้อมูลผู้แจ้งเพิ่มเติม (user มีอยู่แล้วจากตอน login)
    await client.query(
      `UPDATE users
       SET title_name = $1, first_name = $2, last_name = $3, phone_number = $4
       WHERE user_id = $5`,
      [user.title_name, user.first_name, user.last_name, user.phone_number, session.userId]
    );

    // 2. สร้าง complaint (gen complaint_no เอง, retry ถ้าเลขชนกันโดยบังเอิญ)
    let complaintId: string | null = null;
    for (let attempt = 0; attempt < 5 && !complaintId; attempt++) {
      try {
        const complaintNo = generateComplaintNo();
        const res = await client.query(
          `INSERT INTO complaints
             (complaint_no, tenant_id, channel_id, user_id, category_id, subcategory_id,
              district, province, detail, additional_detail, location_text,
              latitude, longitude, geocoded_at, current_status_id, is_public_view)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true)
           RETURNING complaint_id`,
          [
            complaintNo, TENANT_ID, CHANNEL_LINE_LIFF_ID, session.userId,
            complaint.category_id, complaint.subcategory_id,
            complaint.district, complaint.province, complaint.detail,
            complaint.additional_datail ?? complaint.additional ?? "",
            complaint.location, complaint.latitude || null, complaint.longitude || null,
            complaint.geocoded_at || null, STATUS_PENDING_ID,
          ]
        );
        complaintId = res.rows[0].complaint_id;
      } catch (err: any) {
        if (err.code === "23505") continue; // unique_violation บน complaint_no ลองใหม่
        throw err;
      }
    }
    if (!complaintId) throw new Error("ไม่สามารถสร้างเลขที่คำร้องได้ (ชนกันซ้ำหลายครั้ง)");

    // 3. insert ไฟล์แนบ (ถ้ามี)
    for (const f of files ?? []) {
      await client.query(
        `INSERT INTO complaint_files
           (complaint_id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [complaintId, f.file_name, f.file_path, f.file_url, f.file_type, f.mime_type, f.file_size || null, session.userId]
      );
    }

    // 4. workflow log แรก (สร้างคำร้อง)
    await client.query(
      `INSERT INTO workflow_logs
         (complaint_id, from_status_id, to_status_id, action_type, action_by, action_note)
       VALUES ($1, NULL, $2, 'SUBMIT', $3, 'รอดำเนินการ')`,
      [complaintId, STATUS_PENDING_ID, session.userId]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, complaintId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("form/submit error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}