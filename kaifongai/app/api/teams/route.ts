import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// รายชื่อทีม/ฝ่ายงาน สำหรับเมนู Department Dashboard
// ย้ายมาจาก main.py: @app.get("/api/teams")

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT t.team_id, t.team_name, t.team_code, t.description,
             d.department_name, d.department_code
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      WHERE t.tenant_id = $1 AND t.is_active = true
      ORDER BY t.team_name
      `,
      [TENANT_ID]
    );

    const data = result.rows.map((r) => ({
      id: r.team_id,
      name: r.team_name,
      code: r.team_code,
      description: r.description,
      department_name: r.department_name,
      department_code: r.department_code,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/teams):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}