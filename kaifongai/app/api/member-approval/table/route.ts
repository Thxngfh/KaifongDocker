/**
 * API: /api/member-approval/table
 * ทำหน้าที่: ดึงข้อมูลสมาชิกทั้งหมดในระบบ (รวมถึงสถานะ Pending, Approved, Rejected)
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าจอตารางอนุมัติสมาชิก (Member Approval Table) ในแดชบอร์ดระบบจัดการ
 *   - ใช้ฟังก์ชัน `readData()` จาก `@/services/memberData` เพื่ออ่านข้อมูลสมาชิกจำลอง
 *   - สัมพันธ์กับ `/api/member-approval/update-table` ที่ทำหน้าที่แก้ไขข้อมูลสมาชิกในแหล่งนี้
 *     และ `/api/member-approval/summary` ที่ทำหน้าที่คำนวณสรุปสถิติจากสมาชิกกลุ่มเดียวกัน
 */

import { NextResponse } from "next/server";
import type {Member} from "@/services/memberData"
import {readData} from "@/services/memberData" 

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อส่งคืนข้อมูลรายการสมาชิกทั้งหมดในรูปแบบ JSON ไปยังฝั่ง Client
 * ความสัมพันธ์: ถูกเรียกโดยตารางบนหน้า UI เพื่อแสดงรายชื่อสมาชิกและสถานะการอนุมัติ
 */
export async function GET() {
  const data = await getMember();
  return NextResponse.json(data);
}

/**
 * getMember
 * ทำหน้าที่: ดึงข้อมูลอาร์เรย์ของสมาชิกทั้งหมดจากไฟล์เก็บข้อมูล JSON จำลอง
 * ความสัมพันธ์: ทำการดึงคุณสมบัติ `.member` จากข้อมูลที่โหลดเข้ามาผ่าน `readData()`
 */
/* สมาชิกทั้งหมด */
export async function getMember(): Promise<Member[]> {
  return readData().member;
}

