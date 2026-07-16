import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// สถิติแยกตาม 6 หมวดหมู่หลัก สำหรับ Pie + Bar Chart
// ย้ายมาจาก main.py: @app.get("/api/by-category")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2025-01-01";
    const endDate = searchParams.get("end_date") || "2025-12-31";

    const result = await pool.query(
      `
      SELECT
          cs.category_name AS name,
          cs.category_code AS code,
          cat.color_code    AS color,
          SUM(cs.total_cases)                                              AS total,
          SUM(cs.resolved_cases + cs.closed_cases)                         AS done,
          SUM(cs.total_cases - cs.resolved_cases - cs.closed_cases - cs.rejected_cases) AS open,
          ROUND(
              SUM(cs.avg_resolution_hours * (cs.resolved_cases + cs.closed_cases))
              / NULLIF(SUM(cs.resolved_cases + cs.closed_cases), 0),
          1) AS avg_hours
      FROM category_summary cs
      JOIN categories cat ON cat.category_id = cs.category_id
      WHERE cs.tenant_id = $1 AND cs.summary_date BETWEEN $2 AND $3
      GROUP BY cs.category_id, cs.category_name, cs.category_code, cat.color_code, cat.display_order
      ORDER BY total DESC
      `,
      [TENANT_ID, startDate, endDate]
    );

    const data = result.rows.map((r) => ({
      name: r.name,
      code: r.code,
      color: r.color || "#888888",
      total: Number(r.total),
      done: Number(r.done),
      open: Number(r.open),
      avg_hours: Number(r.avg_hours || 0),
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/by-category):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}