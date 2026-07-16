import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// แนวโน้ม SLA รายเดือน (on_time vs breach)
// ย้ายมาจาก main.py: @app.get("/api/ml/risk/sla-trend")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2024-01-01";
    const endDate = searchParams.get("end_date") || "2026-12-31";

    const result = await pool.query(
      `
      SELECT
          TO_CHAR(COALESCE(c.resolved_at, c.closed_at), 'YYYY-MM') AS month,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = TRUE)  AS breached
      FROM complaints c
      JOIN v_complaint_sla vcs ON vcs.complaint_id = c.complaint_id
      WHERE c.tenant_id = $1
        AND vcs.is_resolution_breached IS NOT NULL
        AND COALESCE(c.resolved_at, c.closed_at) BETWEEN $2 AND $3
      GROUP BY month
      ORDER BY month
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`]
    );

    const data = result.rows.map((r) => {
      const onTime = Number(r.on_time || 0);
      const breached = Number(r.breached || 0);
      const total = onTime + breached;
      return {
        month: r.month,
        on_time: onTime,
        breached,
        total,
        breach_pct: total > 0 ? Math.round((breached * 100 * 10) / total) / 10 : 0,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/ml/risk/sla-trend):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
