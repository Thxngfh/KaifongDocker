/** 
import data from "@/data/mock_data_may2026.json";
import { calcResolvedDuration, calcPendingDuration,getComplaintNumber } from "@/lib/mockDB/caseUtils";
import type { ServiceRequest,Status, UserPayload } from "@/lib/mockDB/requests.types";

//ฟังก์ชันหลักนี้คือส่วนที่จะมาแสดงในหน้า track-complaint/detail โดยจะดึงข้อมูลเรื่องร้องเรียนที่ส่ง id มาใน params มาแสดง
//คำอธิบายส่วนใหญ่คล้ายกับ GET ใน route.ts ปกติที่ไม่มี id สามารถดูรายละเอียดบางอันที่เหมือนกันในนั้นได้เลย
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = data.complaints.find((c) => c.complaint_id === id);
  if (!item) return Response.json({ error: "not found" }, { status: 404 });

  const status: Status = getStatusCode(item.current_status_id);
  const isResolved   = status === "resolved" 
  const user = getUser(item.user_id) ;
 
  const result: Partial<ServiceRequest> &  Partial<UserPayload> = {
    id:          item.complaint_id,
    complaintNo: getComplaintNumber(item.complaint_no),
    title:       item.title ?? "",
    //รายละเอียด user ของแต่ละ complaint ที่ user เขียนลง form 
    
    title_name: user.titleName,
    first_name: user.firstName,
    last_name: user.lastName,
    phone_number: user.phone,
 
    // รายละเอียดคำร้อง
    category:    getCategory(item.category_id),
    subcategory: getSubcategory(item.subcategory_id),
    location:    item.location_text,
    detail: item.detail,
    additional: item.additional_detail ?? "",

    // fake image metadata for frontend evidence display
    images: getComplaintImages(item.complaint_id),

    // fields ที่ส่วนแสดงรายละเอียดสถานะในส่วนล่างใช้
    status,
    actionNote:  isResolved
                        ? calcResolvedDuration(item.created_at, item.resolved_at) : getLatestActionNote(item.complaint_id), 
    detailMeta: isResolved
                      ? ""
                      : status === "pending"
                      ?  "\u00A0\u00A0\u00A0·\u00A0\u00A0" + calcPendingDuration(item.created_at)
                      : `\n${calcPendingDuration(item.created_at)}`,
    
  };

  return Response.json(result);
}
function getUser(id: string) {
  //ที่ใช้แบบนี้เพราะบางฟอร์ม user กรอกข้อมูลไม่เหมือนกัน แต่ตารางแบบใหม่ จะมี ข้อมุล ต่างๆในนี้ ยุแล้วใน ตาราง user ไม่ต้อง split จาก displayname 
  const u = data.meta.reference_ids.citizen_users.find(c => c.user_id === id)
  const [firstName, lastName] = u?.display_name?.split(" ") ?? ["", ""]
  return {
    titleName: "", //ในตารางอัปเดตมีส่วนนี้ "คิดว่าน่าจะ" ใช้ หรือจะไม่ใช้ก็ได้
    firstName,
    lastName,
    phone:     u?.phone,
  }
}
function getCategory(id: string): string {
  return data.meta.reference_ids.categories.find((c) => c.category_id === id)?.name ?? "-";
}

function getSubcategory(id: string): string {
  return data.meta.reference_ids.subcategories.find((s) => s.subcategory_id === id)?.name ?? "-";
}

function getComplaintImages(complaintId: string) {
  //ใส่ข้อมุลตามที่ดึงมาได้จากตาราง complaint_files โดยอิงจาก complaint_id
  //ในนี้แค่เขียนฟังก์ชันสมมติขึ้นมาเพื่อให้ได้โครงสร้างข้อมูลที่ frontend ต้องการเท่านั้น ไม่ได้ดึงจาก db จริงๆ
  const fileName1 = `${complaintId}-1.jpg`;
  const fileName2 = `${complaintId}-2.jpg`;
  //ดึงข้อมูลสมมติมาเฉยๆ ตอนนี้
  return [
    {
      url: `https://jb95rtzbpi708swr.public.blob.vercel-storage.com/%E0%B8%82%E0%B8%A2%E0%B8%B02-GcHdIVGK6wQvLV6Y4eRUPvkSR4JIQG.jpg`,
      filePath: `/complaints/${complaintId}/${fileName1}`,
      filename: fileName1,
    },
    {
      url: null,
      filePath: `/complaints/${complaintId}/${fileName2}`,
      filename: fileName2,
    },
  ];
}


function getLatestActionNote(complaintId: string): string {
  const logs = data.workflow_logs
    .filter((l) => l.complaint_id === complaintId)
    .sort((a, b) => new Date(b.action_datetime).getTime() - new Date(a.action_datetime).getTime());
  return logs[0]?.action_note ?? "-";
}

function getStatusCode(statusId: string): Status {
  const code = data.meta.reference_ids.statuses.find(
    (s) => s.status_id === statusId
  )?.code;
   switch (code) {
    case "OPEN":
    case "PENDING":
      return "pending";
    case "IN_PROGRESS":
      return "in_progress";
    case "RESOLVED":
    case "CLOSED":
      return "resolved";
    case "PAUSED":
      return "paused";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}
*/

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/iron-session-config";
import { calcResolvedDuration, calcPendingDuration, getComplaintNumber } from "@/lib/mockDB/caseUtils";
import type { ServiceRequest, Status, UserPayload } from "@/lib/mockDB/requests.types";

function mapStatusCode(code: string | null): Status {
  switch (code) {
    case "OPEN":
    case "PENDING":
      return "pending";
    case "IN_PROGRESS":
      return "in_progress";
    case "RESOLVED":
    case "CLOSED":
      return "resolved";
    case "PAUSED":
      return "paused";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT
       c.complaint_id, c.complaint_no, c.detail, c.additional_detail,
       c.location_text, c.created_at, c.resolved_at, c.user_id,
       cat.category_name,
       sub.subcategory_name,
       sm.status_code,
       u.title_name, u.first_name, u.last_name, u.phone_number,
       latest_log.action_note AS latest_action_note
     FROM complaints c
     LEFT JOIN categories cat ON cat.category_id = c.category_id
     LEFT JOIN subcategories sub ON sub.subcategory_id = c.subcategory_id
     LEFT JOIN status_master sm ON sm.status_id = c.current_status_id
     LEFT JOIN users u ON u.user_id = c.user_id
     LEFT JOIN LATERAL (
       SELECT action_note FROM workflow_logs wl
       WHERE wl.complaint_id = c.complaint_id
       ORDER BY wl.action_datetime DESC LIMIT 1
     ) latest_log ON true
     WHERE c.complaint_id = $1`,
    [id]
  );

  const item = rows[0];
  if (!item) return Response.json({ error: "not found" }, { status: 404 });

  // กันไม่ให้เห็น complaint ของคนอื่น
  if (item.user_id !== session.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { rows: files } = await pool.query(
    `SELECT file_name, file_path, file_url FROM complaint_files WHERE complaint_id = $1`,
    [id]
  );

  const status: Status = mapStatusCode(item.status_code);
  const isResolved = status === "resolved";

  const result: Partial<ServiceRequest> & Partial<UserPayload> = {
    id: item.complaint_id,
    complaintNo: getComplaintNumber(item.complaint_no),
    title: item.category_name ?? "",

    title_name: item.title_name ?? "",
    first_name: item.first_name ?? "",
    last_name: item.last_name ?? "",
    phone_number: item.phone_number,

    category: item.category_name ?? "-",
    subcategory: item.subcategory_name ?? "-",
    location: item.location_text,
    detail: item.detail,
    additional: item.additional_detail ?? "",

    images: files.map((f) => ({
      url: f.file_url,
      filePath: f.file_path,
      filename: f.file_name,
    })),

    status,
    actionNote: isResolved
      ? calcResolvedDuration(item.created_at, item.resolved_at)
      : item.latest_action_note ?? "-",
    detailMeta: isResolved
      ? ""
      : status === "pending"
      ? "\u00A0\u00A0\u00A0·\u00A0\u00A0" + calcPendingDuration(item.created_at)
      : `\n${calcPendingDuration(item.created_at)}`,
  };

  return Response.json(result);
}