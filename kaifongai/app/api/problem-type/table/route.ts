/**
 * API: /api/problem-type/table
 * ทำหน้าที่: ดึงรายการประเภทปัญหาทั้งหมด พร้อมทั้งนับจำนวนเคส (cases) ที่อยู่ในแต่ละประเภทปัญหา
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าตารางแสดงประเภทปัญหา (Problem Types Table) ในระบบหลังบ้าน
 *   - ดึงข้อมูลเคสและประเภทปัญหาจำลองจากไฟล์ `@/data/alternative/data2.json`
 *   - สัมพันธ์กับ `/api/problem-type/summary` เพื่อแสดงข้อมูลสอดคล้องกันบนหน้าการจัดการประเภทปัญหา


import { NextResponse } from "next/server";
import rawData from "@/data/alternative/data2.json";

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อคืนค่ารายการประเภทปัญหาที่รวมสถิติจำนวนเคสเรียบร้อยแล้วในรูปแบบ JSON
 * ความสัมพันธ์: ถูกเรียกโดยหน้า UI เพื่ออัปเดตและแสดงข้อมูลในตารางจัดการประเภทปัญหา

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
*/
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const data = await getProblemWithCounts();
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("DB ERROR (/api/problem-type/table):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function getProblemWithCounts() {
  const result = await pool.query(`
    SELECT
      cat.category_id,
      cat.category_name AS name,
      cat.description,
      cat.is_active,
      COUNT(c.complaint_id) AS total_cases
    FROM categories cat
    LEFT JOIN complaints c ON c.category_id = cat.category_id
    GROUP BY cat.category_id, cat.category_name, cat.description, cat.is_active
    ORDER BY cat.display_order ASC
  `);

  return result.rows.map((row) => ({
    id: row.category_id,
    name: row.name,
    description: row.description,
    is_active: row.is_active,
    total_cases: Number(row.total_cases),
  }));
}