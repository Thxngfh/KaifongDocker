import { NextResponse } from "next/server";
import { getProblemWithCounts } from "@/services/DataProvider";

export async function GET() {
  const data = await getProblemWithCounts();

  return NextResponse.json({
    data
  });
}