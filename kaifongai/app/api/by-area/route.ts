import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// สถิติแยกตาม 10 เขต สำหรับ Bar + Heatmap + แผนที่ (react-leaflet)
// ย้ายมาจาก main.py: @app.get("/api/by-area")
// หมายเหตุ: team_id ใน main.py เดิมก็ไม่ได้ใช้กรองจริงเช่นกัน (dead code) — พอร์ตตรงพฤติกรรมเดิม

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2025-01-01";
    const endDate = searchParams.get("end_date") || "2025-12-31";

    const result = await pool.query(
      `
      SELECT
          district,
          SUM(total_cases)                                    AS total,
          SUM(total_cases - resolved_cases - closed_cases)     AS open,
          SUM(resolved_cases + closed_cases)                   AS done,
          SUM(sla_breached_cases)                              AS sla_breach,
          ROUND(
              SUM(resolved_cases + closed_cases) * 100.0 / NULLIF(SUM(total_cases), 0),
          1) AS closure_rate
      FROM area_summary
      WHERE tenant_id = $1 AND summary_date BETWEEN $2 AND $3
      GROUP BY district
      ORDER BY total DESC
      `,
      [TENANT_ID, startDate, endDate]
    );

    const geoResult = await pool.query(
      `
      SELECT district, AVG(latitude)::float AS lat, AVG(longitude)::float AS lng
      FROM complaints
      WHERE tenant_id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY district
      `,
      [TENANT_ID]
    );
    const geoByDistrict: Record<string, { lat: number; lng: number }> = {};
    for (const g of geoResult.rows) {
      geoByDistrict[g.district] = { lat: g.lat, lng: g.lng };
    }

    const data = result.rows.map((r) => ({
      district: r.district,
      total: Number(r.total),
      open: Number(r.open),
      done: Number(r.done),
      sla_breach: Number(r.sla_breach),
      closure_rate: Number(r.closure_rate || 0),
      lat: geoByDistrict[r.district]?.lat ?? null,
      lng: geoByDistrict[r.district]?.lng ?? null,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/by-area):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}