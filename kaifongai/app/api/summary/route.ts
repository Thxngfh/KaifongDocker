/**
 * API: /api/summary
 * ทำหน้าที่: ดึงข้อมูลและประมวลผลสรุปแดชบอร์ดหลักของระบบ (Main Dashboard Summary)
 * ความสัมพันธ์:
 *   - ทำงานร่วมกับแดชบอร์ดหลัก (Dashboard Overview Page) เพื่อแสดงตัวเลขสถิติ กราฟ และแนวโน้มข้อมูล
 *   - เรียกใช้โมดูล `@/lib/summaryDashboard` (ฟังก์ชัน `getSummaryDataDashboard`) เพื่อคำนวณข้อมูลแดชบอร์ด
 *   - อ่านข้อมูลหลักจาก `@/data/alternative/data2.json` เพื่อทำโครงสร้างข้อมูลแบบ DashboardData
 *   - สัมพันธ์กับ `/api/table` ที่ดึงข้อมูลเคสในตารางแดชบอร์ดหลักเช่นเดียวกัน
 */

// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { getSummaryDataDashboard } from "@/lib/summaryDashboard";
import rawData from "@/data/alternative/data2.json";
import type {DashboardData} from "@/services/DataProvider";

/**
 * GET Handler
 * ทำหน้าที่: รับ Request แบบ GET เพื่อจัดเตรียมข้อมูล ดำเนินการวิเคราะห์/สรุป แล้วส่งผลสรุปของแดชบอร์ดกลับไปในรูปแบบ JSON
 * ความสัมพันธ์: ถูกเรียกโดยหน้าแรกของระบบแดชบอร์ดเพื่อเรนเดอร์กราฟ วิดเจ็ต และข้อมูลสรุป
 */
export async function GET() {
  const data = await getData();
  const summary = await getSummaryDataDashboard(data);
  return NextResponse.json(summary);
}

/**
 * getData
 * ทำหน้าที่: โหลดและกรอง/แมปข้อมูลดิบ (Raw JSON) ให้อยู่ในโครงสร้าง `DashboardData`
 *   - ทำการทำความสะอาดสถานะของเคสให้รองรับเฉพาะ pending, in_progress, resolved เท่านั้น (นอกเหนือจากนี้ให้เป็น pending)
 *   - แมปโครงสร้างของข้อมูล Users, Technicians, Problems, และ Case Status Logs เพื่อพร้อมนำไปใช้ในการคำนวณสถิติ
 * ความสัมพันธ์: อ่านและจัดระเบียบข้อมูลจาก `rawData` ในไฟล์ JSON
 */
export async function getData(): Promise<DashboardData> {
 // const now = new Date();

  return {
    cases: rawData.cases
      //.filter((c: any) => new Date(c.datetime) <= now) // กรอง datetime ไม่เกินวันนี้
      .map((c: any) => ({
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
      })),

    users: rawData.users.map((u: any) => ({
      id: u.id,
      created_at: u.datetime, // map datetime -> created_at
    })),

    technicians: rawData.technicians.map((t: any) => ({
      id: t.id,
      status: t.status === "approved" ? "approved" : "offline",
    })),

    problems: rawData.problems,

    case_status_logs: rawData.case_status_logs
      //.filter((cl: any) => new Date(cl.changed_at) <= now) // กรองอนาคต
      .map((cl: any) => ({
        id: cl.id,
        case_id: cl.case_id,
        status: cl.status,
        changed_at: cl.changed_at,
      })),
  };
}