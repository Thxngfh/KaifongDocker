import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// SLA รายวัน สำหรับ Gauge + Line Chart + แยกตาม priority/category/subcategory
// ย้ายมาจาก main.py: @app.get("/api/sla")

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2025-01-01";
    const endDate = searchParams.get("end_date") || "2025-12-31";

    const summaryResult = await pool.query(
      `
      SELECT
          SUM(on_time_cases)  AS on_time,
          SUM(breached_cases) AS breached,
          SUM(total_cases)    AS total_with_sla,
          ROUND(SUM(avg_resolution_hours * total_cases) / NULLIF(SUM(total_cases), 0), 1) AS avg_hours
      FROM sla_summary
      WHERE tenant_id = $1 AND summary_date BETWEEN $2 AND $3
      `,
      [TENANT_ID, startDate, endDate]
    );
    const summary = summaryResult.rows[0] || {};
    const totalSla = Number(summary.total_with_sla || 0);
    const onTime = Number(summary.on_time || 0);
    const slaPct = totalSla > 0 ? round1((onTime / totalSla) * 100) : 0;

    const spanDays =
      Math.round(
        (new Date(endDate + "T00:00:00Z").getTime() - new Date(startDate + "T00:00:00Z").getTime()) /
          86400000
      ) + 1;
    const pEnd = addDays(startDate, -1);
    const pSt = addDays(startDate, -spanDays);

    const prevResult = await pool.query(
      `
      SELECT
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total_with_sla
      FROM complaints c
      JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE c.tenant_id = $1 AND c.created_at BETWEEN $2 AND $3
      `,
      [TENANT_ID, pSt, `${pEnd} 23:59:59`]
    );
    const prevRow = prevResult.rows[0] || {};
    const prevTotal = Number(prevRow.total_with_sla || 0);
    const prevOnTime = Number(prevRow.on_time || 0);
    const prevSlaPct = prevTotal > 0 ? round1((prevOnTime / prevTotal) * 100) : null;
    const slaPctDelta = prevSlaPct !== null ? round1(slaPct - prevSlaPct) : null;

    const byPriorityResult = await pool.query(
      `
      SELECT
          pl.priority_name, pl.priority_code, pl.color_code,
          ROUND(AVG(vcs.sla_resolution_time_min)) AS avg_target_min,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total
      FROM complaints      c
      JOIN priority_levels pl  ON c.priority_id = pl.priority_id
      JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE c.tenant_id = $1 AND c.created_at BETWEEN $2 AND $3
      GROUP BY pl.priority_id, pl.priority_name, pl.priority_code, pl.color_code, pl.display_order
      ORDER BY pl.display_order
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`]
    );

    const byCategoryResult = await pool.query(
      `
      SELECT
          cat.category_name, cat.category_code, cat.color_code,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total
      FROM complaints      c
      JOIN categories      cat ON c.category_id = cat.category_id
      JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE c.tenant_id = $1 AND c.created_at BETWEEN $2 AND $3
      GROUP BY cat.category_id, cat.category_name, cat.category_code, cat.color_code, cat.display_order
      ORDER BY cat.display_order
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`]
    );

    const bySubcategoryResult = await pool.query(
      `
      SELECT
          sub.subcategory_name, sub.subcategory_code, cat.category_name,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total
      FROM complaints      c
      JOIN subcategories   sub ON c.subcategory_id = sub.subcategory_id
      JOIN categories      cat ON sub.category_id   = cat.category_id
      JOIN v_complaint_sla vcs ON c.complaint_id    = vcs.complaint_id
      WHERE c.tenant_id = $1 AND c.created_at BETWEEN $2 AND $3
      GROUP BY sub.subcategory_id, sub.subcategory_name, sub.subcategory_code, cat.category_name
      ORDER BY sub.subcategory_name
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`]
    );

    const pctOf = (onTimeN: number, totalN: number) =>
      round1((onTimeN / Math.max(totalN, 1)) * 100);

    return NextResponse.json({
      summary: {
        sla_pct: slaPct,
        on_time: onTime,
        breached: Number(summary.breached || 0),
        avg_hours: Number(summary.avg_hours || 0),
        prev_sla_pct: prevSlaPct,
        sla_pct_delta: slaPctDelta,
        prev_period: { start: pSt, end: pEnd },
      },
      by_priority: byPriorityResult.rows.map((r) => ({
        name: r.priority_name,
        code: r.priority_code,
        color: r.color_code,
        avg_target_min: Number(r.avg_target_min || 0),
        on_time: Number(r.on_time),
        total: Number(r.total),
        sla_pct: pctOf(Number(r.on_time), Number(r.total)),
      })),
      by_category: byCategoryResult.rows.map((r) => ({
        name: r.category_name,
        code: r.category_code,
        color: r.color_code || "#888888",
        on_time: Number(r.on_time),
        total: Number(r.total),
        sla_pct: pctOf(Number(r.on_time), Number(r.total)),
      })),
      by_subcategory: bySubcategoryResult.rows.map((r) => ({
        subcategory: r.subcategory_name,
        code: r.subcategory_code,
        category: r.category_name,
        on_time: Number(r.on_time),
        total: Number(r.total),
        sla_pct: pctOf(Number(r.on_time), Number(r.total)),
      })),
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/sla):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}