/**
 * API: /api/problem-type/table
 * ทำหน้าที่: ดึงรายการประเภทปัญหาทั้งหมด พร้อมทั้งนับจำนวนเคส (cases) ที่อยู่ในแต่ละประเภทปัญหา
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าตารางแสดงประเภทปัญหา (Problem Types Table) ในระบบหลังบ้าน
 *   - ดึงข้อมูลเคสและประเภทปัญหาจำลองจากไฟล์ `@/data/alternative/data2.json`
 *   - สัมพันธ์กับ `/api/problem-type/summary` เพื่อแสดงข้อมูลสอดคล้องกันบนหน้าการจัดการประเภทปัญหา
 */

import { NextResponse } from "next/server";
import rawData from "@/data/alternative/data2.json";

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อคืนค่ารายการประเภทปัญหาที่รวมสถิติจำนวนเคสเรียบร้อยแล้วในรูปแบบ JSON
 * ความสัมพันธ์: ถูกเรียกโดยหน้า UI เพื่ออัปเดตและแสดงข้อมูลในตารางจัดการประเภทปัญหา
 */
export async function GET() {
  const data = await getProblemWithCounts();

  return NextResponse.json({
    data
  });
}

/**
 * getProblemWithCounts
 * ทำหน้าที่: 
 *   1. ดึงข้อมูลกรณีร้องเรียน (cases) และประเภทปัญหา (problems) จาก mock JSON
 *   2. สร้างแผนที่ข้อมูล (Map) สรุปจำนวนเคสตาม `problem_id`
 *   3. นำมาจัดกลุ่มและผนวกเข้ากับรายชื่อประเภทปัญหา เพื่อเพิ่มฟิลด์ `total_cases` ลงไปในแต่ละประเภทปัญหา
 * ความสัมพันธ์: ประมวลผลร่วมกันระหว่าง `rawData.cases` และ `rawData.problems`
 */
//table
export async function getProblemWithCounts() {
  const cases = rawData.cases;
  const problems = rawData.problems;

  const countMap: Record<number, number> = {};

  for (const c of cases) {
    countMap[c.problem_id] = (countMap[c.problem_id] || 0) + 1;
  }

  //merge กับ problems
  return problems.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_active: p.is_active,
    total_cases: countMap[p.id] || 0
  }));
}