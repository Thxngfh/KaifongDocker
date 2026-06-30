/**
 * API: /api/member-approval/update-table
 * ทำหน้าที่: อัปเดตสถานะการอนุมัติของสมาชิก (เช่น จาก pending เป็น approved หรือ rejected)
 * ความสัมพันธ์:
 *   - ถูกเรียกใช้งานเมื่อผู้ดูแลระบบกดปุ่มอนุมัติหรือปฏิเสธคำขอสมัครสมาชิกในหน้าเว็บ
 *   - ทำหน้าที่เขียนทับข้อมูลลงในไฟล์ JSON จำลองผ่านฟังก์ชัน `writeData()` ใน `@/services/memberData`
 *   - ข้อมูลที่ถูกอัปเดตในหน้านี้จะส่งผลต่อความถูกต้องของข้อมูลในหน้าสรุป (`/api/member-approval/summary`) 
 *     และตารางสมาชิกทั้งหมด (`/api/member-approval/table` รวมถึงกลุ่มสิทธิ์ใน `/api/permission-management/*`)
 */
/*
import { NextResponse } from "next/server";
import {readData,writeData} from "@/services/memberData" 
import type {Member} from "@/services/memberData"

/**
 * POST Handler
 * ทำหน้าที่: รับ Request แบบ POST ที่มี ID และ Status ใหม่ของสมาชิกใน Body 
 *           จากนั้นทำการเรียกใช้งานฟังก์ชันเพื่อดำเนินการอัปเดตและตอบกลับผลการทำงาน
 * ความสัมพันธ์: รับข้อมูล JSON (id, status) และส่งผลลัพธ์กลับในรูปแบบ { success: true, data: Member[] }
 
export async function POST(req: Request) {
  const body = await req.json();
  const { id, status } = body;

  const data = await updateMemberStatus(id, status);

  return NextResponse.json({
    success: true,
    data,
  });
}

/**
 * updateMemberStatus
 * ทำหน้าที่: ค้นหาสมาชิกที่มี ID ตรงกันในไฟล์ข้อมูลหลัก แล้วดำเนินการ:
 *   - อัปเดตฟิลด์ `status` เป็นสถานะใหม่
 *   - ตั้งค่า `is_active` เป็น true หากสถานะคือ "approved"
 *   - บันทึกเวลาอนุมัติ `approve_at` เป็นเวลาปัจจุบันหากสถานะไม่ใช่ "pending"
 *   - เขียนข้อมูลที่เปลี่ยนแปลงลงในไฟล์ระบบ และคืนค่าข้อมูลสมาชิกชุดใหม่กลับไป
 * ความสัมพันธ์: เรียกใช้ `readData()` เพื่ออ่านข้อมูลต้นฉบับ และ `writeData()` เพื่ออัปเดตข้อมูลและบันทึก
 
/* update status 
export async function updateMemberStatus(
  id: number,
  status: string
): Promise<Member[]> {
  const data = readData();

  const updatedMembers = data.member.map((member) =>
    member.id === id
      ? {
          ...member,
          status,
          is_active: status === "approved",
          approve_at:
            status !== "pending"
              ? new Date().toISOString()
              : "",
        }
      : member
  );

  writeData({ member: updatedMembers });

  return updatedMembers;
}
*/
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { Member } from "@/services/memberData";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const data = await updateMemberStatus(id, status);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/member-approval/update-table):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function updateMemberStatus(
  id: string,
  status: string
): Promise<Member[]> {
  const isActive = status === "approved";
  const approvedAt = status !== "pending" ? new Date() : null;

  await pool.query(
    `
    UPDATE users
    SET status = $1,
        is_active = $2,
        approved_at = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $4
    `,
    [status, isActive, approvedAt, id]
  );

  // คืนค่ารายการสมาชิกทั้งหมดที่อัปเดตแล้ว (ใช้ query เดียวกับ /api/member-approval/table)
  const result = await pool.query(`
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      u.line_user_id,
      u.status,
      u.is_active,
      r.role_name,
      d.department_name,
      u.created_at,
      u.approved_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN user_departments ud ON ud.user_id = u.user_id AND ud.is_primary = true
    LEFT JOIN departments d ON ud.department_id = d.department_id
    ORDER BY u.created_at DESC
  `);

  return result.rows.map((row) => ({
    id: row.user_id,
    name: row.first_name || "",
    lastname: row.last_name || "",
    email: row.email || "",
    phone: row.phone_number || "",
    line_id: row.line_user_id || "",
    status: row.status,
    is_active: row.is_active,
    role: row.role_name || "",
    department: row.department_name || "",
    technician_type: "",
    datetime: new Date(row.created_at).toISOString(),
    approve_at: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
  }));
}