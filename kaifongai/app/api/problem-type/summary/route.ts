import { NextResponse } from "next/server";
import { getProblemSummary } from "@/services/DataProvider";

export async function GET() {
  const data = await  getProblemSummary();

  return NextResponse.json({
    data
  });
}