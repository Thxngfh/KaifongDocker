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
function readData(): { member: Member[] } {
  const file = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(file);
}

/* เขียนไฟล์ */
function writeData(data: { member: Member[] }) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/* สมาชิกทั้งหมด */
export async function getMember(): Promise<Member[]> {
  return readData().member;
}

/* รอดำเนินการ */
export async function getpendingMembers(): Promise<Member[]> {
  return readData().member.filter(
    (member) => member.status === "pending"
  );
}

/* อนุมัติแล้ว */
export async function getApprovedMembers(): Promise<Member[]> {
  return readData().member.filter(
    (member) => member.status === "approved"
  );
}

/* summary */
export async function getMemberSummary(): Promise<MemberSummary> {
  const members = readData().member.filter(
    (m) => m.status === "approved"
  );

  return {
    admin: members.filter((m) => m.role === "แอดมิน").length,
    staff: members.filter((m) => m.role === "เจ้าหน้าที่").length,
    auditor: members.filter((m) => m.role === "ผู้ตรวจสอบ").length,
    inactive: members.filter((m) => !m.is_active).length,
  };
}

/*member-approved*/
export async function getMemberApprovalSummary(): Promise<MemberApprovalSummary> {
  const members = readData().member;

  const today = new Date().toISOString().split("T")[0];

  /* คำขอวันนี้ */
  const requestToday = members.filter(
    (m) => m.datetime?.split("T")[0] === today
  ).length;

  /* สถานะต่าง ๆ */
  const pending = members.filter(
    (m) => m.status === "pending"
  ).length;

  const rejected = members.filter(
    (m) => m.status === "rejected"
  ).length;

  const approved = members.filter(
    (m) => m.status === "approved"
  ).length;

  /* ความเร็วอนุมัติเฉลี่ย (ชม.) */
  const approvedMembers = members.filter(
    (m) => m.status === "approved" && m.approve_at
  );

  const totalHours = approvedMembers.reduce((sum, m) => {
    const requestTime = new Date(m.datetime).getTime();
    const approveTime = new Date(m.approve_at!).getTime();

    return sum + (approveTime - requestTime) / (1000 * 60 * 60);
  }, 0);

  const avgApproveHours =
    approvedMembers.length > 0
      ? Number((totalHours / approvedMembers.length).toFixed(1))
      : 0;

  return {
    requestToday,
    pending,
    rejected,
    approved,
    avgApproveHours,
  }
}

/* update status */
export async function updateMemberStatus(
  id: number,
  status: string
): Promise<Member[]> {
  const data = readData();

  const updatedMembers = data.member.map((member) =>
    member.id === id
      ? {
          ...member,
          status,
          is_active: status === "approved",
          approve_at:
            status !== "pending"
              ? new Date().toISOString()
              : "",
        }
      : member
  );

  writeData({ member: updatedMembers });

  return updatedMembers;
}