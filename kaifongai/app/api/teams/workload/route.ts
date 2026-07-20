import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { STATUS } from "@/lib/constants";

// Department Dashboard ต่อฝ่าย: summary + workload รายคน + แยกตาม subcategory
// ย้ายมาจาก main.py: @app.get("/api/teams/workload")

const OPEN_STATUSES = [STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.PAUSED];
const pctOrNull = (onTime: number, total: number) =>
  total > 0 ? Math.round((onTime / Math.max(total, 1)) * 100 * 10) / 10 : null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const teamId = searchParams.get("team_id");
    const startDate = searchParams.get("start_date") || "2025-01-01";
    const endDate = searchParams.get("end_date") || "2025-12-31";
    const endDateFull = `${endDate} 23:59:59`;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "team_id is required" },
        { status: 400 }
      );
    }

    const teamResult = await pool.query(
      `
      SELECT t.team_name, t.team_code, d.department_name, d.department_code
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      WHERE t.team_id = $1
      `,
      [teamId]
    );
    const team = teamResult.rows[0];
    if (!team) {
      return NextResponse.json({ success: false, error: "ไม่พบทีมนี้" }, { status: 404 });
    }

    const staffCountResult = await pool.query(
      `SELECT COUNT(*) AS n FROM team_members WHERE team_id = $1 AND is_active = true`,
      [teamId]
    );

    const backlogResult = await pool.query(
      `SELECT COUNT(*) AS n FROM complaints WHERE assigned_team_id = $1 AND current_status_id IN ($2, $3, $4)`,
      [teamId, ...OPEN_STATUSES]
    );

    const deptSlaResult = await pool.query(
      `
      SELECT
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total_with_sla
      FROM complaints      c
      JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE c.assigned_team_id = $1 AND c.created_at BETWEEN $2 AND $3
      `,
      [teamId, startDate, endDateFull]
    );
    const deptSla = deptSlaResult.rows[0] || {};
    const deptTotalSla = Number(deptSla.total_with_sla || 0);
    const deptOnTime = Number(deptSla.on_time || 0);
    const deptSlaPct = deptTotalSla > 0 ? Math.round((deptOnTime / deptTotalSla) * 100 * 10) / 10 : 0;

    const staffResult = await pool.query(
      `
      SELECT
          u.user_id,
          COALESCE(u.display_name, TRIM(u.first_name || ' ' || u.last_name)) AS name,
          r.role_name,
          COUNT(c.complaint_id) FILTER (WHERE c.current_status_id IN ($1, $2, $3)) AS active_count,
          COUNT(c.complaint_id) FILTER (
              WHERE c.current_status_id IN ($1, $2, $3)
                AND vcs.remaining_sla_min IS NOT NULL AND vcs.remaining_sla_min < 0
          ) AS overdue_count,
          COUNT(c.complaint_id) FILTER (
              WHERE vcs.is_resolution_breached = FALSE
                AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)
                AND c.created_at BETWEEN $4 AND $5
          ) AS on_time,
          COUNT(c.complaint_id) FILTER (
              WHERE vcs.is_resolution_breached IS NOT NULL
                AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)
                AND c.created_at BETWEEN $4 AND $5
          ) AS total_with_sla,
          COUNT(c.complaint_id) FILTER (WHERE c.created_at BETWEEN $4 AND $5) AS assigned_count,
          COUNT(c.complaint_id) FILTER (
              WHERE c.created_at BETWEEN $4 AND $5
                AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)
          ) AS done_count,
          AVG(
              EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, c.closed_at) - c.created_at)) / 3600.0
          ) FILTER (
              WHERE c.created_at BETWEEN $4 AND $5
                AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)
          ) AS avg_resolution_hours
      FROM team_members    tm
      JOIN users           u   ON tm.user_id = u.user_id
      LEFT JOIN roles      r   ON u.role_id  = r.role_id
      LEFT JOIN complaints c   ON c.assigned_user_id = u.user_id
      LEFT JOIN v_complaint_sla vcs ON c.complaint_id = vcs.complaint_id
      WHERE tm.team_id = $6 AND tm.is_active = true
      GROUP BY u.user_id, name, r.role_name
      ORDER BY active_count DESC
      `,
      [...OPEN_STATUSES, startDate, endDateFull, teamId]
    );

    const subcatResult = await pool.query(
      `
      SELECT
          sub.subcategory_name,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached = FALSE
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS on_time,
          COUNT(*) FILTER (WHERE vcs.is_resolution_breached IS NOT NULL
                             AND (c.resolved_at IS NOT NULL OR c.closed_at IS NOT NULL)) AS total_with_sla
      FROM complaints      c
      JOIN subcategories   sub ON c.subcategory_id = sub.subcategory_id
      JOIN v_complaint_sla vcs ON c.complaint_id   = vcs.complaint_id
      WHERE c.assigned_team_id = $1 AND c.created_at BETWEEN $2 AND $3
      GROUP BY sub.subcategory_id, sub.subcategory_name
      ORDER BY total DESC
      `,
      [teamId, startDate, endDateFull]
    );

    return NextResponse.json({
      team: {
        name: team.team_name,
        code: team.team_code,
        department_name: team.department_name,
        department_code: team.department_code,
      },
      summary: {
        staff_count: Number(staffCountResult.rows[0]?.n || 0),
        active_cases: Number(backlogResult.rows[0]?.n || 0),
        sla_pct: deptSlaPct,
      },
      staff: staffResult.rows.map((s) => ({
        user_id: String(s.user_id),
        name: s.name || "ไม่ระบุชื่อ",
        role: s.role_name || "เจ้าหน้าที่",
        active_count: Number(s.active_count || 0),
        overdue_count: Number(s.overdue_count || 0),
        assigned_count: Number(s.assigned_count || 0),
        done_count: Number(s.done_count || 0),
        avg_resolution_hours:
          s.avg_resolution_hours !== null ? Math.round(Number(s.avg_resolution_hours) * 10) / 10 : null,
        sla_pct: pctOrNull(Number(s.on_time || 0), Number(s.total_with_sla || 0)),
      })),
      subcategories: subcatResult.rows.map((r) => ({
        subcategory: r.subcategory_name,
        total: Number(r.total || 0),
        sla_pct: pctOrNull(Number(r.on_time || 0), Number(r.total_with_sla || 0)),
      })),
    });
  } catch (error: any) {
    console.error("DB ERROR (/api/teams/workload):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}