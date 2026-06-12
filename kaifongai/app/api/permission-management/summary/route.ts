import { NextResponse } from "next/server";
import {  getMemberSummary} from "@/services/memberData";
 
 export async function GET() {
   const data = await getMemberSummary();
   return NextResponse.json(data);
 }