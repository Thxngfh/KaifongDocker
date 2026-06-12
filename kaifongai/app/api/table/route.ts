import { NextResponse } from "next/server";
import {  getCases,sortDate } from "@/services/DataProvider";

export async function GET() {
  const sortData = await sortDate();
  return NextResponse.json(sortData);
}