import { NextResponse } from "next/server";
import {  getMember } from "@/services/memberData";

export async function GET() {
  const data = await getMember();
  return NextResponse.json(data);
}