/**
 * API: /api/member-approval/update-table
 * ทำหน้าที่: อัปเดตสถานะการอนุมัติของสมาชิก (เช่น จาก pending เป็น approved หรือ rejected)
 * ความสัมพันธ์:
 *   - ถูกเรียกใช้งานเมื่อผู้ดูแลระบบกดปุ่มอนุมัติหรือปฏิเสธคำขอสมัครสมาชิกในหน้าเว็บ
 *   - ทำหน้าที่เขียนทับข้อมูลลงในไฟล์ JSON จำลองผ่านฟังก์ชัน `writeData()` ใน `@/services/memberData`
 *   - ข้อมูลที่ถูกอัปเดตในหน้านี้จะส่งผลต่อความถูกต้องของข้อมูลในหน้าสรุป (`/api/member-approval/summary`) 
 *     และตารางสมาชิกทั้งหมด (`/api/member-approval/table` รวมถึงกลุ่มสิทธิ์ใน `/api/permission-management/*`)
 */

import { NextResponse } from "next/server";
import {readData,writeData} from "@/services/memberData" 
import type {Member} from "@/services/memberData"

/**
 * POST Handler
 * ทำหน้าที่: รับ Request แบบ POST ที่มี ID และ Status ใหม่ของสมาชิกใน Body 
 *           จากนั้นทำการเรียกใช้งานฟังก์ชันเพื่อดำเนินการอัปเดตและตอบกลับผลการทำงาน
 * ความสัมพันธ์: รับข้อมูล JSON (id, status) และส่งผลลัพธ์กลับในรูปแบบ { success: true, data: Member[] }
 */
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
 */
/* update status */
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