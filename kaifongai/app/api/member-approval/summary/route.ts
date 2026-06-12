import { NextResponse } from "next/server";
import { getMemberApprovalSummary } from "@/services/memberData";

export async function GET() {
  const data = await getMemberApprovalSummary();

  return NextResponse.json(data);
}