import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// Top ประเภทปัญหาที่ SLA Breach บ่อยที่สุด (มองย้อนหลัง เคสที่จบแล้วจริง)
// ย้ายมาจาก main.py: @app.get("/api/ml/risk/top-breach-categories")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2024-01-01";
    const endDate = searchParams.get("end_date") || "2026-12-31";
    const limitParam = Number(searchParams.get("limit") || 6);
    const limit = Math.min(Math.max(limitParam, 1), 20);

    const result = await pool.query(
      `
      SELECT
          COALESCE(sub.subcategory_name, cat.category_name)          AS name,
          cat.color_code                                              AS color,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = TRUE)   AS breach_count,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL) AS total
      FROM complaints         c
      JOIN categories         cat ON c.category_id       = cat.category_id
      LEFT JOIN subcategories sub ON c.subcategory_id     = sub.subcategory_id
      JOIN v_complaint_sla    vcs ON c.complaint_id       = vcs.complaint_id
      WHERE c.tenant_id = $1
        AND vcs.is_resolution_breached IS NOT NULL
        AND COALESCE(c.resolved_at, c.closed_at) BETWEEN $2 AND $3
      GROUP BY COALESCE(sub.subcategory_name, cat.category_name), cat.color_code
      HAVING COUNT(*) FILTER (WHERE vcs.is_resolution_breached = TRUE) > 0
      ORDER BY breach_count DESC
      LIMIT $4
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`, limit]
    );

    const data = result.rows.map((r) => {
      const breachCount = Number(r.breach_count);
      const total = Number(r.total);
      return {
        name: r.name,
        color: r.color || "#888888",
        breach_count: breachCount,
        total,
        breach_pct: total ? Math.round(((breachCount * 100) / total) * 10) / 10 : 0,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/ml/risk/top-breach-categories):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
