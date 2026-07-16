import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID, STATUS } from "@/lib/constants";

// ตรวจหาเรื่องที่ต้องแจ้งเตือน (บนหน้า Analytics/Executive Dashboard)
// ย้ายมาจาก main.py: @app.get("/api/alerts")

export async function GET() {
  try {
    const alerts: { level: string; message: string }[] = [];

    const highRiskResult = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM v_complaint_risk_active v
      JOIN complaints c ON c.complaint_id = v.complaint_id
      WHERE c.tenant_id = $1 AND v.risk_tier = 'HIGH' AND c.current_status_id = $2
      `,
      [TENANT_ID, STATUS.PENDING]
    );
    const highRiskCnt = Number(highRiskResult.rows[0]?.cnt || 0);
    if (highRiskCnt > 0) {
      alerts.push({
        level: "high",
        message: `มีเคสความเสี่ยงสูง (จากโมเดล ML) ที่ยังไม่ถูกจัดการ ${highRiskCnt} เรื่อง`,
      });
    }

    const overdueResult = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM complaints c
      JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE c.tenant_id = $1
        AND vcs.remaining_sla_min < 0
        AND c.current_status_id NOT IN ($2, $3, $4)
      `,
      [TENANT_ID, STATUS.RESOLVED, STATUS.CLOSED, STATUS.REJECTED]
    );
    const overdueCnt = Number(overdueResult.rows[0]?.cnt || 0);
    if (overdueCnt > 0) {
      alerts.push({ level: "high", message: `เรื่องเกิน SLA และยังค้างอยู่ ${overdueCnt} เรื่อง` });
    }

    const oldResult = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM complaints
      WHERE tenant_id = $1
        AND created_at < NOW() - INTERVAL '7 days'
        AND current_status_id NOT IN ($2, $3, $4)
      `,
      [TENANT_ID, STATUS.RESOLVED, STATUS.CLOSED, STATUS.REJECTED]
    );
    const oldCnt = Number(oldResult.rows[0]?.cnt || 0);
    if (oldCnt > 0) {
      alerts.push({ level: "medium", message: `เรื่องค้างนานกว่า 7 วัน ${oldCnt} เรื่อง` });
    }

    const reopenResult = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM workflow_logs wl
      JOIN complaints    c  ON wl.complaint_id = c.complaint_id
      WHERE c.tenant_id = $1
        AND wl.action_type = 'REOPEN'
        AND wl.action_datetime >= NOW() - INTERVAL '7 days'
      `,
      [TENANT_ID]
    );
    const reopenCnt = Number(reopenResult.rows[0]?.cnt || 0);
    if (reopenCnt > 0) {
      alerts.push({
        level: "medium",
        message: `มีการเปิดเรื่องใหม่ (REOPEN) 7 วันนี้ ${reopenCnt} เรื่อง`,
      });
    }

    const hotResult = await pool.query(
      `
      SELECT cat.category_name, COUNT(*) AS cnt
      FROM complaints   c
      JOIN categories cat ON c.category_id = cat.category_id
      WHERE c.tenant_id = $1 AND c.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY cat.category_name
      ORDER BY cnt DESC
      LIMIT 1
      `,
      [TENANT_ID]
    );
    const hot = hotResult.rows[0];
    if (hot) {
      alerts.push({
        level: "info",
        message: `หมวด '${hot.category_name}' มีเรื่องสูงสุดในสัปดาห์นี้ (${Number(hot.cnt)} เรื่อง)`,
      });
    }

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("DB ERROR (/api/alerts):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}