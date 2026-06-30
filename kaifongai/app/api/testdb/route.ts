import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW() as current_time, COUNT(*) as total_complaints FROM complaints");
    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("DB ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        code: error?.code,
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}