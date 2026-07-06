import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.complaint_id,
        c.complaint_no,
        c.title,
        c.detail,
        c.district,
        c.province,
        c.created_at,
        c.updated_at,
        c.due_date,
        c.resolved_at,
        c.is_public_view,
        ch.channel_name,
        ch.channel_code,
        cat.category_name,
        sub.subcategory_name,
        st.status_code,
        st.status_name,
        pr.priority_code,
        pr.priority_name
      FROM complaints c
      LEFT JOIN channels ch          ON c.channel_id = ch.channel_id
      LEFT JOIN categories cat       ON c.category_id = cat.category_id
      LEFT JOIN subcategories sub    ON c.subcategory_id = sub.subcategory_id
      LEFT JOIN status_master st     ON c.current_status_id = st.status_id
      LEFT JOIN priority_levels pr   ON c.priority_id = pr.priority_id
      ORDER BY c.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("DB ERROR (/api/table):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
