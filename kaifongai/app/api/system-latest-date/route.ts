import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";
 
// วันที่ล่าสุดที่มีข้อมูลจริงในระบบ (ใช้แทน "วันนี้" ฝั่ง frontend สำหรับ default date range)
// ย้ายมาจาก main.py: @app.get("/api/system-latest-date")
 
export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT GREATEST(
        (SELECT MAX(created_at) FROM complaints WHERE tenant_id = $1),
        (SELECT MAX(wl.action_datetime)
           FROM workflow_logs wl
           JOIN complaints c ON wl.complaint_id = c.complaint_id
          WHERE c.tenant_id = $1)
      ) AS latest
      `,
      [TENANT_ID]
    );
 
    const latest = result.rows[0]?.latest;
    return NextResponse.json({
      latest_date: latest ? new Date(latest).toISOString().slice(0, 10) : null,
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/system-latest-date):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}