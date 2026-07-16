import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// จำนวนเรื่องรายวัน สำหรับ Line Chart
// ย้ายมาจาก main.py: @app.get("/api/trend")
// หมายเหตุ: ใน main.py เดิม พารามิเตอร์ team_id ถูกรับเข้ามาแต่ไม่ได้ใช้กรองจริงใน SQL
// (เป็น dead code) พอร์ตมาให้ตรงพฤติกรรมเดิมไว้ก่อน — ถ้าต้องการให้กรองตามทีมจริง
// ต้องเพิ่ม AND c.assigned_team_id = $4 เอง

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2025-01-01";
    const endDate = searchParams.get("end_date") || "2025-12-31";

    const result = await pool.query(
      `
      SELECT
          summary_date                    AS day,
          new_complaints                  AS new_cases,
          (resolved_cases + closed_cases) AS done_cases,
          sla_breached_cases              AS at_risk
      FROM daily_complaint_summary
      WHERE tenant_id = $1 AND summary_date BETWEEN $2 AND $3
      ORDER BY summary_date
      `,
      [TENANT_ID, startDate, endDate]
    );

    const data = result.rows.map((r) => ({
      date: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
      new_cases: Number(r.new_cases),
      done_cases: Number(r.done_cases),
      at_risk: Number(r.at_risk),
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/trend):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}