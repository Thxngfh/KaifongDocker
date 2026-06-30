/**
 * API: /api/permission-management/table
 * ทำหน้าที่: ดึงข้อมูลรายการสมาชิกเฉพาะผู้ที่ได้รับการอนุมัติแล้ว (approved) เพื่อใช้จัดตารางจัดการสิทธิ์และบทบาท
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับตารางในหน้าจัดการสิทธิ์การใช้งาน (Permission Management Page)
 *   - เรียกอ่านข้อมูลสมาชิกจำลองจากบริการ `@/services/memberData`
 *   - ทำงานสอดคล้องกับ `/api/permission-management/summary` ซึ่งสรุปตัวเลขตามสิทธิ์ต่าง ๆ ของสมาชิกกลุ่มนี้
 

import { NextResponse } from "next/server";
import type {Member} from "@/services/memberData";
import {readData} from "@/services/memberData" 

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อคืนค่าข้อมูลสมาชิกที่มีสถานะ approved ทั้งหมดกลับไปแสดงในตาราง
 * ความสัมพันธ์: ถูกเรียกโดย Client เพื่อใช้ในการโหลดข้อมูลตารางบริหารจัดการสิทธิ์ของพนักงานและผู้ดูแลระบบ
 
export async function GET() {
  const data = await getApprovedMembers();
  return NextResponse.json(data);
}

/**
 * getApprovedMembers
 * ทำหน้าที่: ดึงและคัดกรองข้อมูลสมาชิกทั้งหมดจากไฟล์เก็บข้อมูล JSON จำลอง โดยเลือกเฉพาะคนที่มี `status === "approved"`
 * ความสัมพันธ์: ดึงข้อมูลจาก `readData().member` และกรองข้อมูลเฉพาะสมาชิกที่ผ่านการอนุมัติแล้วเท่านั้น
 */
/* อนุมัติแล้ว 
export async function getApprovedMembers(): Promise<Member[]> {
  return readData().member.filter(
    (member) => member.status === "approved"
  );
}
*/
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { Member } from "@/services/memberData";

export async function GET() {
  try {
    const data = await getApprovedMembers();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/permission-management/table):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function getApprovedMembers(): Promise<Member[]> {
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
    WHERE u.status = 'approved'
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
