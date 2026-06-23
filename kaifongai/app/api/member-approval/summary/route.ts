/**
 * API: /api/member-approval/summary
 * ทำหน้าที่: สรุปผลทางสถิติและข้อมูลภาพรวมสำหรับการอนุมัติสมาชิก (Member Approval Summary)
 * ความสัมพันธ์: 
 *   - ทำงานร่วมกับหน้าจอ Member Approval (แดชบอร์ดการจัดการ/อนุมัติสมาชิกใหม่)
 *   - เรียกใช้ฟังก์ชัน `readData()` จาก `@/services/memberData` เพื่ออ่านข้อมูลจำลองจาก JSON
 *   - สัมพันธ์กับ `/api/member-approval/table` และ `/api/member-approval/update-table` 
 *     ซึ่งใช้ฐานข้อมูลจำลอง (Mock JSON) แหล่งเดียวกัน
 */

import { NextResponse } from "next/server";
import type {MemberApprovalSummary} from "@/services/memberData"
import {readData} from "@/services/memberData" 

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อดึงข้อมูลสรุปการอนุมัติสมาชิกไปแสดงผลในแดชบอร์ด
 * ความสัมพันธ์: ถูกเรียกใช้งานโดยหน้าเว็บฝั่ง Client (เช่น หน้าแดชบอร์ดการอนุมัติ) เพื่ออัปเดตการแสดงผลการ์ดตัวเลขสถิติต่างๆ
 */
export async function GET() {
  const data = await getMemberApprovalSummary();

  return NextResponse.json(data);
}

/**
 * getMemberApprovalSummary
 * ทำหน้าที่: คำนวณหาค่าสถิติเกี่ยวกับการสมัครสมาชิกและอนุมัติสมาชิก ได้แก่:
 *   - จำนวนคำขอที่เข้ามาวันนี้ (requestToday)
 *   - จำนวนสมาชิกที่อยู่ในสถานะรออนุมัติ (pending)
 *   - จำนวนสมาชิกที่ถูกปฏิเสธการอนุมัติ (rejected)
 *   - จำนวนสมาชิกที่ผ่านการอนุมัติแล้ว (approved)
 *   - เวลาเฉลี่ยที่ใช้ในการอนุมัติ (หน่วยเป็นชั่วโมง) (avgApproveHours)
 * ความสัมพันธ์: ดึงข้อมูลสมาชิกทั้งหมดจาก JSON ผ่าน `readData().member` แล้วนำมาประมวลผลคำนวณสถิติ
 */
/*member-approved*/
export async function getMemberApprovalSummary(): Promise<MemberApprovalSummary> {
  // [MOCK] ดึงจาก JSON — เปลี่ยนเป็น db.query("SELECT * FROM members") เมื่อใช้ DB
  const members = readData().member;
  const today = new Date().toISOString().split("T")[0];

  /* คำขอวันนี้ */
  const requestToday = members.filter(
    (m) => m.datetime?.split("T")[0] === today
  ).length;

  /* สถานะต่าง ๆ */
  const pending = members.filter(
    (m) => m.status === "pending"
  ).length;

  const rejected = members.filter(
    (m) => m.status === "rejected"
  ).length;

  const approved = members.filter(
    (m) => m.status === "approved"
  ).length;

  /* ความเร็วอนุมัติเฉลี่ย (ชม.) */
  const approvedMembers = members.filter(
    (m) => m.status === "approved" && m.approve_at
  );

  const totalHours = approvedMembers.reduce((sum, m) => {
    const requestTime = new Date(m.datetime).getTime();
    const approveTime = new Date(m.approve_at!).getTime();

    return sum + (approveTime - requestTime) / (1000 * 60 * 60); // ms → ชั่วโมง
  }, 0);
  // เฉลี่ย ทศนิยม 1 ตน. — ถ้าไม่มีข้อมูลคืน 0
  const avgApproveHours =
    approvedMembers.length > 0
      ? Number((totalHours / approvedMembers.length).toFixed(1))
      : 0;

  return {
    requestToday,
    pending,
    rejected,
    approved,
    avgApproveHours,
  }
}

