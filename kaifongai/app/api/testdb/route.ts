import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json 
      { error: "database connection failed" },
      { status: 500 }
    );
  }
}
