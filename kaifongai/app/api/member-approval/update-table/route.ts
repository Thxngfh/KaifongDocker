import { NextResponse } from "next/server";
import { updateMemberStatus } from "@/services/memberData";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, status } = body;

  const data = await updateMemberStatus(id, status);

  return NextResponse.json({
    success: true,
    data,
  });
}