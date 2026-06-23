/**
 * API: /api/table
 * ทำหน้าที่: ดึงข้อมูลประวัติเคสคำร้องเรียนทั้งหมด โดยมีการคัดกรองข้อมูล และทำการจัดเรียงตามวันที่และเวลาจากใหม่สุดไปเก่าสุด
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับหน้าตารางแสดงผลเคสคำร้องเรียนในหน้าแดชบอร์ดหลัก (Dashboard Cases Table)
 *   - โหลดข้อมูลกรณีร้องเรียนจำลองจาก `@/data/alternative/data2.json`
 *   - สัมพันธ์กับ `/api/summary` ซึ่งดึงข้อมูลเคสไปสรุปสถิติและนับจำนวน
 */

import { NextResponse } from "next/server";
import type {Case} from "@/services/DataProvider";
import rawData from "@/data/alternative/data2.json";

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อดึงข้อมูลเคสที่จัดเรียงเรียบร้อยแล้วไปแสดงผลในตาราง
 * ความสัมพันธ์: ถูกเรียกโดย Client เพื่อใช้แสดงรายการเรื่องร้องเรียนทั้งหมดในหน้าแดชบอร์ด
 */
export async function GET() {
  const sortData = await sortDate();
  return NextResponse.json(sortData);
}

/**
 * sortDate
 * ทำหน้าที่: ดึงข้อมูลเคสผ่านฟังก์ชัน `getCases()` จากนั้นนำมาทำการเรียงลำดับตามเวลา (`datetime`) จากใหม่สุดไปเก่าสุด (Descending Order)
 * ความสัมพันธ์: เรียกใช้งานฟังก์ชัน `getCases()` เพื่อดึงและกรองข้อมูลตั้งต้น
 */
//sort Date CaseTable /dashboard
export async function sortDate(): Promise<Case[]> {
  const cases = await getCases(); 
  // เรียงล่าสุด → เก่าสุด
  const sortedCases = cases.sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );
  return sortedCases;
}

/**
 * getCases
 * ทำหน้าที่: ดึงข้อมูลกรณีร้องเรียนดิบจาก mock JSON และทำการแมปข้อมูลให้อยู่ในโครงสร้าง `Case` 
 *           พร้อมกับทำความสะอาดสถานะของข้อมูล (`status`) ให้อยู่ในกลุ่ม pending, in_progress, resolved เท่านั้น
 * ความสัมพันธ์: ดึงข้อมูลจาก `rawData.cases`
 */
// ดึง Cases
export async function getCases(): Promise<Case[]> {
  return rawData.cases.map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    problem_id: c.problem_id,
    datetime: c.datetime,
    status:
      c.status === "pending" || c.status === "in_progress" || c.status === "resolved"
        ? c.status
        : "pending",
    description: c.description,
    location: c.location,
    location_detail: c.location_detail,
    location_lat: c.location_lat,
    location_lng: c.location_lng,
    location_url: c.location_url,
    picture_url: c.picture_url,
  }));
}