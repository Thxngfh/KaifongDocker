/**
 * API: /api/permission-management/table
 * ทำหน้าที่: ดึงข้อมูลรายการสมาชิกเฉพาะผู้ที่ได้รับการอนุมัติแล้ว (approved) เพื่อใช้จัดตารางจัดการสิทธิ์และบทบาท
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับตารางในหน้าจัดการสิทธิ์การใช้งาน (Permission Management Page)
 *   - เรียกอ่านข้อมูลสมาชิกจำลองจากบริการ `@/services/memberData`
 *   - ทำงานสอดคล้องกับ `/api/permission-management/summary` ซึ่งสรุปตัวเลขตามสิทธิ์ต่าง ๆ ของสมาชิกกลุ่มนี้
 */

import { NextResponse } from "next/server";
import type {Member} from "@/services/memberData";
import {readData} from "@/services/memberData" 

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อคืนค่าข้อมูลสมาชิกที่มีสถานะ approved ทั้งหมดกลับไปแสดงในตาราง
 * ความสัมพันธ์: ถูกเรียกโดย Client เพื่อใช้ในการโหลดข้อมูลตารางบริหารจัดการสิทธิ์ของพนักงานและผู้ดูแลระบบ
 */
export async function GET() {
  const data = await getApprovedMembers();
  return NextResponse.json(data);
}

/**
 * getApprovedMembers
 * ทำหน้าที่: ดึงและคัดกรองข้อมูลสมาชิกทั้งหมดจากไฟล์เก็บข้อมูล JSON จำลอง โดยเลือกเฉพาะคนที่มี `status === "approved"`
 * ความสัมพันธ์: ดึงข้อมูลจาก `readData().member` และกรองข้อมูลเฉพาะสมาชิกที่ผ่านการอนุมัติแล้วเท่านั้น
 */
/* อนุมัติแล้ว */
export async function getApprovedMembers(): Promise<Member[]> {
  return readData().member.filter(
    (member) => member.status === "approved"
  );
}