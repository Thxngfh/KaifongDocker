import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { STATUS } from "@/lib/constants";

// รายเคสที่เจ้าหน้าที่คนนี้ถืออยู่ตอนนี้ (snapshot ปัจจุบัน ไม่ผูกกับช่วงวันที่)
// ย้ายมาจาก main.py: @app.get("/api/staff/cases")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
          c.complaint_no, c.district,
          cat.category_name, sub.subcategory_name,
          pl.priority_name, pl.color_code AS priority_color,
          sm.status_name, sm.color_code AS status_color,
          EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 AS days_open,
          vcs.remaining_sla_min
      FROM complaints       c
      JOIN categories       cat ON c.category_id       = cat.category_id
      JOIN subcategories    sub ON c.subcategory_id    = sub.subcategory_id
      JOIN priority_levels  pl  ON c.priority_id       = pl.priority_id
      JOIN status_master    sm  ON c.current_status_id = sm.status_id
      LEFT JOIN v_complaint_sla vcs ON c.complaint_id  = vcs.complaint_id
      WHERE c.assigned_user_id = $1
        AND c.current_status_id IN ($2, $3, $4)
      ORDER BY vcs.remaining_sla_min ASC NULLS LAST
      `,
      [userId, STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.PAUSED]
    );

    const data = result.rows.map((r) => ({
      no: r.complaint_no,
      district: r.district,
      category: r.category_name,
      subcategory: r.subcategory_name,
      priority: r.priority_name,
      priority_color: r.priority_color || "#888888",
      status: r.status_name,
      status_color: r.status_color || "#888888",
      days_open: Math.round(Number(r.days_open || 0) * 10) / 10,
      is_overdue: r.remaining_sla_min !== null && Number(r.remaining_sla_min) < 0,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/staff/cases):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}