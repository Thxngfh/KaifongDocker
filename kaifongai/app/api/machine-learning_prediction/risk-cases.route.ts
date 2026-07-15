import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { TENANT_ID, STATUS } from "@/lib/constants";

// SLA Breach Risk — รายเคส (ค้นหา + กรองระดับ + แยกกลุ่มความเร่งด่วน)
// ย้ายมาจาก main.py: @app.get("/api/ml/risk/cases")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const level = searchParams.get("level"); // HIGH | MEDIUM | LOW
    const search = searchParams.get("search");
    const group = searchParams.get("group"); // urgent | watch
    const limitParam = Number(searchParams.get("limit") || 100);
    const limit = Math.min(limitParam, 500);

    // สร้างเงื่อนไข WHERE แบบไดนามิก (เทียบเท่า where/params ใน main.py)
    const where: string[] = ["c.tenant_id = $1", "c.current_status_id NOT IN ($2, $3, $4)"];
    const params: any[] = [TENANT_ID, STATUS.RESOLVED, STATUS.CLOSED, STATUS.REJECTED];

    if (level && ["HIGH", "MEDIUM", "LOW"].includes(level.toUpperCase())) {
      params.push(level.toUpperCase());
      where.push(`v.risk_tier = $${params.length}`);
    }

    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      const startIdx = params.length + 1;
      where.push(`(
        c.complaint_no ILIKE $${startIdx} OR
        c.district     ILIKE $${startIdx + 1} OR
        cat.category_name ILIKE $${startIdx + 2} OR
        sub.subcategory_name ILIKE $${startIdx + 3}
      )`);
      params.push(like, like, like, like);
    }

    const whereSql = where.join(" AND ");

    let groupSql = "";
    let orderSql = "ORDER BY t.risk_score DESC";
    if (group === "urgent") {
      groupSql = "WHERE t.sla_days IS NOT NULL AND (t.sla_days - t.days_open) <= 1";
      orderSql = "ORDER BY (t.sla_days - t.days_open) ASC, t.risk_score DESC";
    } else if (group === "watch") {
      groupSql = "WHERE t.sla_days IS NULL OR (t.sla_days - t.days_open) > 1";
      orderSql = "ORDER BY t.risk_score DESC";
    }

    // นับจำนวนจริงทั้งหมดที่ตรงเงื่อนไข (ก่อน LIMIT)
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS cnt FROM (
          SELECT
              EXTRACT(DAY FROM (COALESCE(c.resolved_at, c.closed_at, NOW()) - c.created_at))::int AS days_open,
              ROUND(vcs.sla_resolution_time_min / 1440.0)::int                                    AS sla_days
          FROM v_complaint_risk_active v
          JOIN complaints          c   ON c.complaint_id     = v.complaint_id
          JOIN categories          cat ON cat.category_id    = c.category_id
          LEFT JOIN subcategories  sub ON sub.subcategory_id = c.subcategory_id
          LEFT JOIN v_complaint_sla vcs ON vcs.complaint_id  = c.complaint_id
          WHERE ${whereSql}
      ) t
      ${groupSql}
      `,
      params
    );
    const total = Number(countResult.rows[0]?.cnt || 0);

    const rowsParams = [...params, limit];
    const limitIdx = rowsParams.length;

    const rowsResult = await pool.query(
      `
      SELECT * FROM (
          SELECT
              c.complaint_id, c.complaint_no, c.district,
              COALESCE(sub.subcategory_name, cat.category_name) AS type_name,
              EXTRACT(DAY FROM (COALESCE(c.resolved_at, c.closed_at, NOW()) - c.created_at))::int AS days_open,
              ROUND(vcs.sla_resolution_time_min / 1440.0)::int                                    AS sla_days,
              v.risk_score, v.risk_tier,
              crl.shap_top_factors                                                                 AS shap_top_factors
          FROM v_complaint_risk_active v
          JOIN complaints          c   ON c.complaint_id     = v.complaint_id
          JOIN categories          cat ON cat.category_id    = c.category_id
          LEFT JOIN subcategories  sub ON sub.subcategory_id = c.subcategory_id
          LEFT JOIN v_complaint_sla vcs ON vcs.complaint_id  = c.complaint_id
          LEFT JOIN complaint_risk_log crl ON crl.complaint_id = c.complaint_id
                                           AND crl.model_status = 'active'
          WHERE ${whereSql}
      ) t
      ${groupSql}
      ${orderSql}
      LIMIT $${limitIdx}
      `,
      rowsParams
    );

    const cases = rowsResult.rows.map((r) => {
      const daysOpen = r.days_open !== null ? Number(r.days_open) : null;
      const slaDays = r.sla_days !== null ? Number(r.sla_days) : null;
      const remaining =
        slaDays !== null && daysOpen !== null ? slaDays - daysOpen : null;
      return {
        complaint_id: String(r.complaint_id),
        complaint_no: r.complaint_no,
        district: r.district,
        type_name: r.type_name,
        days_open: daysOpen,
        sla_days: slaDays,
        sla_remaining_days: remaining,
        urgent: remaining !== null && remaining <= 1,
        risk_score: Math.round(Number(r.risk_score) * 1000) / 1000,
        risk_tier: r.risk_tier,
        shap_top_factors: r.shap_top_factors || [],
      };
    });

    return NextResponse.json({ cases, total });
  } catch (error: any) {
    console.error("DB ERROR (/api/ml/risk/cases):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
