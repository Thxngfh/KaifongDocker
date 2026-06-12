// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { getSummaryDataDashboard } from "@/lib/summaryDashboard";
import {  getData } from "@/services/DataProvider";

export async function GET() {
  const data = await getData();
  const summary = await getSummaryDataDashboard(data);
  return NextResponse.json(summary);
}