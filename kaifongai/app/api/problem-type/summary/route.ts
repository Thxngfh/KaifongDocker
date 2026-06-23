/**
 * API: /api/problem-type/summary
 * ทำหน้าที่: สรุปภาพรวมและสถิติของประเภทปัญหา (Problem Types) เช่น จำนวนทั้งหมด, เปิดใช้งานอยู่, ปิดใช้งานอยู่
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าการจัดการประเภทเรื่องร้องเรียน/ประเภทปัญหา (Problem Type Settings/Management)
 *   - ดึงข้อมูลประเภทปัญหาจำลองจากไฟล์ `@/data/alternative/data2.json`
 *   - สัมพันธ์กับ `/api/problem-type/table` ซึ่งแสดงประเภทปัญหาแต่ละตัวพร้อมจำนวนเคสทั้งหมด
 */

import { NextResponse } from "next/server";
import rawData from "@/data/alternative/data2.json";

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อดึงข้อมูลสรุปประเภทปัญหาไปใช้แสดงผล
 * ความสัมพันธ์: ถูกเรียกโดย Client เพื่อใช้แสดงข้อมูลสรุปเชิงสถิติที่ด้านบนของหน้าตั้งค่าประเภทปัญหา
 */
export async function GET() {
  const data = await  getProblemSummary();

  return NextResponse.json({
    data
  });
}

/**
 * getProblemSummary
 * ทำหน้าที่: ประมวลผลจำนวนประเภทปัญหาทั้งหมด คำนวณหาจำนวนประเภทปัญหาที่สถานะทำงานอยู่ (active) และหยุดทำงาน (inactive)
 * ความสัมพันธ์: อ่านอาเรย์ `problems` จาก `rawData` ที่มาจากไฟล์ JSON ของระบบ
 */
//summary 
export async function getProblemSummary() {
  const problems = rawData.problems;

  const total = problems.length;

  const active = problems.filter((p: any) => p.is_active).length;

  const inactive = total - active;

  return {
    total,
    active,
    inactive
  };
}