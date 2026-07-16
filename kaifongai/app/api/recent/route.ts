import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// เรื่องร้องเรียนล่าสุด สำหรับตารางในหน้า Analytics (กรองวันที่/ค้นหา/แบ่งหน้า)
// ย้ายมาจาก main.py: @app.get("/api/recent")

function fmtDetail(d: string | null) {
  const text = d || "";
  return text.length > 60 ? text.slice(0, 60) + "..." : text;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = Math.min(Number(searchParams.get("limit") || 10), 50);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);
    const search = searchParams.get("search");

    const where: string[] = ["c.tenant_id = $1"];
    const params: any[] = [TENANT_ID];

    if (startDate && endDate) {
      params.push(startDate, `${endDate} 23:59:59`);
      where.push(`c.created_at BETWEEN $${params.length - 1} AND $${params.length}`);
    }

    if (search) {
      const like = `%${search}%`;
      params.push(like, like, like);
      where.push(
        `(c.complaint_no ILIKE $${params.length - 2} OR c.district ILIKE $${params.length - 1} OR c.detail ILIKE $${params.length})`
      );
    }

    const whereSql = where.join(" AND ");
    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT
          c.complaint_no, c.created_at, c.district, c.detail,
          c.location_text, c.latitude, c.longitude,
          cat.category_name, cat.color_code AS cat_color,
          sub.subcategory_name,
          sm.status_name, sm.status_code, sm.color_code AS status_color,
          pl.priority_name, pl.priority_code, pl.color_code AS priority_color,
          t.team_name,
          COUNT(*) OVER() AS total_count
      FROM complaints        c
      JOIN categories        cat ON c.category_id       = cat.category_id
      LEFT JOIN subcategories sub ON c.subcategory_id    = sub.subcategory_id
      JOIN status_master     sm  ON c.current_status_id  = sm.status_id
      JOIN priority_levels   pl  ON c.priority_id        = pl.priority_id
      LEFT JOIN teams         t  ON c.assigned_team_id    = t.team_id
      WHERE ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    const total = result.rows.length ? Number(result.rows[0].total_count) : 0;

    const items = result.rows.map((r) => ({
      no: r.complaint_no,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      district: r.district,
      detail: fmtDetail(r.detail),
      category: r.category_name,
      cat_color: r.cat_color || "#888",
      status: r.status_name,
      status_code: r.status_code,
      status_color: r.status_color || "#888",
      priority: r.priority_name,
      priority_code: r.priority_code,
      priority_color: r.priority_color || "#888",
      subcategory: r.subcategory_name,
      team_name: r.team_name,
      location_text: r.location_text,
      lat: r.latitude !== null ? Number(r.latitude) : null,
      lng: r.longitude !== null ? Number(r.longitude) : null,
    }));

    return NextResponse.json({ items, total, limit, offset });
  } catch (error: any) {
    console.error("DB ERROR (/api/recent):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}