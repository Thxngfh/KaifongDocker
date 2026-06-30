import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { Member } from "@/services/memberData";

export async function GET() {
  try {
    const data = await getMember();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/member-approval/table):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function getMember(): Promise<Member[]> {
  const result = await pool.query(`
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      u.line_user_id,
      u.status,
      u.is_active,
      r.role_name,
      d.department_name,
      u.created_at,
      u.approved_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN user_departments ud ON ud.user_id = u.user_id AND ud.is_primary = true
    LEFT JOIN departments d ON ud.department_id = d.department_id
    ORDER BY u.created_at DESC
  `);

  return result.rows.map((row) => ({
    id: row.user_id,
    name: row.first_name || "",
    lastname: row.last_name || "",
    email: row.email || "",
    phone: row.phone_number || "",
    line_id: row.line_user_id || "",
    status: row.status,
    is_active: row.is_active,
    role: row.role_name || "",
    department: row.department_name || "",
    technician_type: "",
    datetime: new Date(row.created_at).toISOString(),
    approve_at: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
  }));
}
