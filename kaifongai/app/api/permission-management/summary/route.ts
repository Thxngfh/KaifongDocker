/**
 * API: /api/permission-management/summary
 * ทำหน้าที่: คำนวณข้อมูลสรุปจำนวนผู้ใช้งานที่มีสิทธิ์ต่างๆ ในระบบ (เฉพาะสมาชิกที่ถูกอนุมัติแล้วเท่านั้น)
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าการจัดการสิทธิ์การใช้งาน (Permission Management) ในระบบแดชบอร์ด
 *   - ดึงข้อมูลจากบริการจัดการสมาชิก (`@/services/memberData`)
 *   - สัมพันธ์กับ `/api/permission-management/table` ซึ่งดึงข้อมูลสมาชิกกลุ่มเดียวกันมาแสดงในรูปแบบตาราง
 */

import { NextResponse } from "next/server";
import type {MemberSummary} from "@/services/memberData";
import {readData} from "@/services/memberData" 

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อดึงข้อมูลสถิติแยกตามประเภทบทบาท (Role) ของสมาชิกที่ผ่านการอนุมัติแล้ว
 * ความสัมพันธ์: ถูกเรียกโดย Client เพื่อใช้ในการแสดงผลการ์ดสถิติต่างๆ ในหน้า Permission Management
 */
export async function GET() {
   const data = await getMemberSummary();
   return NextResponse.json(data);
}

/**
 * getMemberSummary
 * ทำหน้าที่: นับจำนวนผู้ใช้งานตามบทบาทต่าง ๆ (แอดมิน, เจ้าหน้าที่, ผู้ตรวจสอบ) และจำนวนผู้ใช้งานที่หยุดการใช้งาน (inactive)
 *   - นับเฉพาะสมาชิกที่มีฟิลด์ `status === "approved"` เท่านั้น
 * ความสัมพันธ์: กรองและจัดกลุ่มข้อมูลที่อ่านได้จาก `readData().member`
 */
/* summary */
export async function getMemberSummary(): Promise<MemberSummary> {
  const members = readData().member.filter(
    (m) => m.status === "approved"
  );

  return {
    admin: members.filter((m) => m.role === "แอดมิน").length,
    staff: members.filter((m) => m.role === "เจ้าหน้าที่").length,
    auditor: members.filter((m) => m.role === "ผู้ตรวจสอบ").length,
    inactive: members.filter((m) => !m.is_active).length,
  };
}

