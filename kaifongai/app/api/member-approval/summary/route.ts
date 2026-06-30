import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { MemberApprovalSummary } from "@/services/memberData";

export async function GET() {
  try {
    const data = await getMemberApprovalSummary();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DB ERROR (/api/member-approval/summary):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function getMemberApprovalSummary(): Promise<MemberApprovalSummary> {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS request_today,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
      COUNT(*) FILTER (WHERE status = 'approved') AS approved,
      AVG(
        EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600
      ) FILTER (WHERE status = 'approved' AND approved_at IS NOT NULL) AS avg_approve_hours
    FROM users
  `);

  const row = result.rows[0];

  return {
    requestToday: Number(row.request_today),
    pending: Number(row.pending),
    rejected: Number(row.rejected),
    approved: Number(row.approved),
    avgApproveHours: row.avg_approve_hours
      ? Number(Number(row.avg_approve_hours).toFixed(1))
      : 0,
  };
}
