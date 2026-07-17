import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

  try {
    const result = await pool.query(
      `
      SELECT
        c.complaint_id,
        c.complaint_no,
        cat.category_name AS title,
        c.detail,
        c.district,
        c.province,
        c.created_at,
        c.updated_at,
        ch.channel_name,
        ch.channel_code,
        cat.category_name,
        sub.subcategory_name,
        u.display_name       AS reporter_name,
        u.phone_number        AS reporter_phone,
        staff.display_name    AS staff_name,
        st.status_code,
        st.status_name
      FROM complaints c
      LEFT JOIN channels       ch    ON c.channel_id = ch.channel_id
      LEFT JOIN categories     cat   ON c.category_id = cat.category_id
      LEFT JOIN subcategories  sub   ON c.subcategory_id = sub.subcategory_id
      LEFT JOIN users          u     ON c.user_id = u.user_id
      LEFT JOIN users          staff ON c.assigned_user_id = staff.user_id
      LEFT JOIN status_master  st    ON c.current_status_id = st.status_id
      WHERE c.complaint_id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Complaint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("DB ERROR (/api/table/[id]):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}