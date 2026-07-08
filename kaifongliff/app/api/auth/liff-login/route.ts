import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/iron-session-config";

export async function POST(req: NextRequest) {
  try {
    const { lineUserId, displayName } = await req.json();

    if (!lineUserId) {
      return NextResponse.json({ error: "missing lineUserId" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (tenant_id, title_name, display_name, line_user_id, citizen_type, is_active, last_login_at)
       VALUES ((SELECT tenant_id FROM tenants LIMIT 1), '', $1, $2, 'ประชาชน', true, NOW())
       ON CONFLICT (line_user_id) DO UPDATE
         SET last_login_at = NOW(), display_name = EXCLUDED.display_name
       RETURNING user_id`,
      [displayName ?? "", lineUserId]
    );
    const userId = rows[0].user_id;

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = userId;
    session.lineUserId = lineUserId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}