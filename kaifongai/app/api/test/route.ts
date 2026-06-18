import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const result = await pool.query(`
    SELECT category_name
    FROM categories
    LIMIT 1
  `);

  console.log(result.rows);

  return NextResponse.json(result.rows);
}
