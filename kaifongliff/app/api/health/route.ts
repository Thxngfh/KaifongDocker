import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    return Response.json({ ok: true, dbTime: rows[0].now });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}