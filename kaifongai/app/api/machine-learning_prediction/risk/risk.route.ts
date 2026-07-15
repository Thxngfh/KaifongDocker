import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID, STATUS } from "@/lib/constants";

// สรุปภาพรวม SLA Breach Risk Prediction model (โมเดล active ล่าสุดจาก model_registry)
// อ่านผ่าน view v_complaint_risk_active
// ย้ายมาจาก main.py: @app.get("/api/ml/risk")

// เคสที่ RESOLVED/CLOSED/REJECTED ไปแล้วไม่มีทาง "เสี่ยง SLA breach" ต่อไปข้างหน้าได้อีก
const OPEN_ONLY_SQL = "c.current_status_id NOT IN ($2, $3, $4)";
const OPEN_ONLY_PARAMS = [STATUS.RESOLVED, STATUS.CLOSED, STATUS.REJECTED];

export async function GET() {
  try {
    const modelResult = await pool.query(`
      SELECT model_version, model_name, roc_auc, pr_auc, accuracy, trained_at, notes,
             feature_importance
      FROM model_registry
      WHERE status = 'active'
      ORDER BY promoted_at DESC
      LIMIT 1
    `);

    const model = modelResult.rows[0];
    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: "Risk model not ready — ยังไม่มีโมเดล active ใน model_registry",
        },
        { status: 503 }
      );
    }

    const summaryResult = await pool.query(
      `
      SELECT
          COUNT(*)                                     AS total,
          COUNT(*) FILTER (WHERE v.risk_tier = 'HIGH')   AS high,
          COUNT(*) FILTER (WHERE v.risk_tier = 'MEDIUM') AS medium,
          COUNT(*) FILTER (WHERE v.risk_tier = 'LOW')    AS low,
          ROUND(AVG(v.risk_score)::numeric, 4)          AS avg_risk_score
      FROM v_complaint_risk_active v
      JOIN complaints c ON c.complaint_id = v.complaint_id
      WHERE c.tenant_id = $1 AND ${OPEN_ONLY_SQL}
      `,
      [TENANT_ID, ...OPEN_ONLY_PARAMS]
    );
    const summary = summaryResult.rows[0] || {};

    const byCategoryResult = await pool.query(
      `
      SELECT
          cat.category_name                             AS name,
          cat.color_code                                AS color,
          COUNT(*)                                      AS total,
          COUNT(*) FILTER (WHERE v.risk_tier = 'HIGH')    AS high_count,
          ROUND(AVG(v.risk_score)::numeric * 100, 1)    AS avg_risk_pct
      FROM v_complaint_risk_active v
      JOIN complaints c   ON c.complaint_id  = v.complaint_id
      JOIN categories cat ON cat.category_id = c.category_id
      WHERE c.tenant_id = $1 AND ${OPEN_ONLY_SQL}
      GROUP BY cat.category_id, cat.category_name, cat.color_code
      ORDER BY avg_risk_pct DESC
      LIMIT 10
      `,
      [TENANT_ID, ...OPEN_ONLY_PARAMS]
    );

    const byDistrictResult = await pool.query(
      `
      SELECT
          c.district                                    AS district,
          COUNT(*)                                      AS total,
          COUNT(*) FILTER (WHERE v.risk_tier = 'HIGH')    AS high_count,
          ROUND(AVG(v.risk_score)::numeric * 100, 1)    AS avg_risk_pct
      FROM v_complaint_risk_active v
      JOIN complaints c ON c.complaint_id = v.complaint_id
      WHERE c.tenant_id = $1 AND ${OPEN_ONLY_SQL}
      GROUP BY c.district
      ORDER BY avg_risk_pct DESC
      LIMIT 10
      `,
      [TENANT_ID, ...OPEN_ONLY_PARAMS]
    );

    return NextResponse.json({
      model: {
        version: model.model_version,
        name: model.model_name,
        roc_auc: model.roc_auc !== null ? Number(model.roc_auc) : null,
        pr_auc: model.pr_auc !== null ? Number(model.pr_auc) : null,
        accuracy: model.accuracy !== null ? Number(model.accuracy) : null,
        trained_at: model.trained_at
          ? new Date(model.trained_at).toISOString().slice(0, 16).replace("T", " ")
          : null,
        notes: model.notes ?? null,
        feature_importance: model.feature_importance || [],
      },
      summary: {
        total: Number(summary.total || 0),
        high: Number(summary.high || 0),
        medium: Number(summary.medium || 0),
        low: Number(summary.low || 0),
        avg_risk_pct: Math.round(Number(summary.avg_risk_score || 0) * 100 * 10) / 10,
      },
      by_category: byCategoryResult.rows.map((r) => ({
        name: r.name,
        color: r.color || "#888888",
        total: Number(r.total),
        high_count: Number(r.high_count),
        avg_risk_pct: Number(r.avg_risk_pct || 0),
      })),
      by_district: byDistrictResult.rows.map((r) => ({
        district: r.district,
        total: Number(r.total),
        high_count: Number(r.high_count),
        avg_risk_pct: Number(r.avg_risk_pct || 0),
      })),
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/ml/risk):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
