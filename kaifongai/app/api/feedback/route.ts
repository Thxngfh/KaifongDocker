import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID } from "@/lib/constants";

// คะแนนความพึงพอใจจากผู้ร้องเรียน (complaint_feedback.score_overall 1-5)
// ย้ายมาจาก main.py: @app.get("/api/feedback")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get("start_date") || "2024-01-01";
    const endDate = searchParams.get("end_date") || "2026-06-30";

    const result = await pool.query(
      `
      SELECT
          ROUND(AVG(cf.score_overall::numeric), 2) AS avg_score,
          COUNT(*) AS total_responses,
          COUNT(*) FILTER (WHERE cf.score_overall = 1) AS s1,
          COUNT(*) FILTER (WHERE cf.score_overall = 2) AS s2,
          COUNT(*) FILTER (WHERE cf.score_overall = 3) AS s3,
          COUNT(*) FILTER (WHERE cf.score_overall = 4) AS s4,
          COUNT(*) FILTER (WHERE cf.score_overall = 5) AS s5
      FROM complaint_feedback cf
      JOIN complaints c ON cf.complaint_id = c.complaint_id
      WHERE c.tenant_id = $1 AND cf.submitted_at BETWEEN $2 AND $3
      `,
      [TENANT_ID, startDate, `${endDate} 23:59:59`]
    );
    const row = result.rows[0] || {};

    return NextResponse.json({
      avg_score: Number(row.avg_score || 0),
      total_responses: Number(row.total_responses || 0),
      by_score: {
        1: Number(row.s1 || 0),
        2: Number(row.s2 || 0),
        3: Number(row.s3 || 0),
        4: Number(row.s4 || 0),
        5: Number(row.s5 || 0),
      },
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/feedback):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}