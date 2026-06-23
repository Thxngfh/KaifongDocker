import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/member.json");

export interface Member {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  line_id: string;
  status: "approved" | "rejected" | "pending" | string;
  is_active: boolean;
  role: "ผู้ตรวจสอบ" | "เจ้าหน้าที่" | "แอดมิน" | string;
  department: string;
  technician_type: string;
  datetime: string;
  approve_at?: string;
}

export interface MemberSummary {
  admin: number;
  staff: number;
  auditor: number;
  inactive: number;
}

export interface MemberApprovalSummary {
  requestToday: number;
  pending: number;
  rejected: number;
  approved: number;
  avgApproveHours: number;
}



/* อ่านไฟล์ล่าสุดทุกครั้ง */
export function readData(): { member: Member[] } {
  const file = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(file);
}

/*เขียนทับไฟล์ (ใช้หลัง update/approve/reject) ใส่ใน data/member*/
export function writeData(data: { member: Member[] }) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}





