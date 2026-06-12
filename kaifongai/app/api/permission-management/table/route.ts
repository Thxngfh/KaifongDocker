import { NextResponse } from "next/server";
import {  getApprovedMembers } from "@/services/memberData";

export async function GET() {
  const data = await getApprovedMembers();
  return NextResponse.json(data);
}