import rawData from "../data/alternative/data2.json";

export interface Case {
  id: number;
  user_id: number;
  problem_id: number;
  datetime: string;
  status: "pending" | "in_progress" | "resolved" | string;
  description?: string;
  location?: string;
  location_detail?: string;
  location_lat?: number;
  location_lng?: number;
  location_url?: string;
  picture_url?: string;
}

export interface User {
  id: number;
  titles?: string,
  name?: string,
  lastname?: string,
  phone?: string,
  line_id?: string,
  created_at: string;
}

export interface Technician {
  id: number;
  status: "approved" | "offline";
  name?: string;
  lastname?: string;
  phone?: string;
  line_id?: string;
  datetime?: string;
}

export interface Problem {
  id: number;
  name: string;
  description: string;
  is_active?: boolean
}

export interface case_status_log{
  id: number,
  case_id: number,
  status: string,
  changed_at: string;
}

export interface DashboardData {
  cases: Case[];
  users: User[];
  technicians: Technician[];
  problems: Problem[];
  case_status_logs: case_status_log[]; 
}
// ดึง Cases
export async function getCases(): Promise<Case[]> {
  return rawData.cases.map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    problem_id: c.problem_id,
    datetime: c.datetime,
    status:
      c.status === "pending" || c.status === "in_progress" || c.status === "resolved"
        ? c.status
        : "pending",
    description: c.description,
    location: c.location,
    location_detail: c.location_detail,
    location_lat: c.location_lat,
    location_lng: c.location_lng,
    location_url: c.location_url,
    picture_url: c.picture_url,
  }));
}

// ดึง Users
export async function getUsers(): Promise<User[]> {
  return rawData.users.map((u: any) => ({
      id: u.id,
      titles: u.title,
      name: u.name,
      lastname: u.lastname,
      phone: u.phone,
      line_id: u.line_id,
      created_at: u.datetime
    }))
}

// ดึง Technicians
export async function getTechnicians(): Promise<Technician[]> {
  return rawData.technicians.map((t: any) => ({
    id: t.id,
    status: t.status === "approved" ? "approved" : "offline",
    name: t.name,
    lastname: t.lastname,
    phone: t.phone,
    line_id: t.line_id,
    datetime: t.datetime
  }));
}

// ดึง Problems
export async function getProblems(): Promise<Problem[]> {
  return rawData.problems;
}

// ดึง Case Status Logs
export async function getCaseStatusLogs(): Promise<case_status_log[]> {
  return rawData.case_status_logs;
}


export async function getData(): Promise<DashboardData> {
 // const now = new Date();

  return {
    cases: rawData.cases
      //.filter((c: any) => new Date(c.datetime) <= now) // กรอง datetime ไม่เกินวันนี้
      .map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        problem_id: c.problem_id,
        datetime: c.datetime,
        status:
          c.status === "pending" || c.status === "in_progress" || c.status === "resolved"
            ? c.status
            : "pending",
        description: c.description,
        location: c.location,
        location_detail: c.location_detail,
        location_lat: c.location_lat,
        location_lng: c.location_lng,
        location_url: c.location_url,
        picture_url: c.picture_url,
      })),

    users: rawData.users.map((u: any) => ({
      id: u.id,
      created_at: u.datetime, // map datetime -> created_at
    })),

    technicians: rawData.technicians.map((t: any) => ({
      id: t.id,
      status: t.status === "approved" ? "approved" : "offline",
    })),

    problems: rawData.problems,

    case_status_logs: rawData.case_status_logs
      //.filter((cl: any) => new Date(cl.changed_at) <= now) // กรองอนาคต
      .map((cl: any) => ({
        id: cl.id,
        case_id: cl.case_id,
        status: cl.status,
        changed_at: cl.changed_at,
      })),
  };
}
// ต่อไป ถ้าเปลี่ยนเป็น DB แค่แก้ getData() ให้ query DB แทน ?


//sort Date CaseTable /dashboard
export async function sortDate(): Promise<Case[]> {
  const cases = await getCases(); 
  // เรียงล่าสุด → เก่าสุด
  const sortedCases = cases.sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );
  return sortedCases;
}

//อันนี้ table
export async function getProblemWithCounts() {
  const cases = rawData.cases;
  const problems = rawData.problems;

  const countMap: Record<number, number> = {};

  for (const c of cases) {
    countMap[c.problem_id] = (countMap[c.problem_id] || 0) + 1;
  }

  //merge กับ problems
  return problems.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_active: p.is_active,
    total_cases: countMap[p.id] || 0
  }));
}

//อันนี้ summary 
export async function getProblemSummary() {
  const problems = rawData.problems;

  const total = problems.length;

  const active = problems.filter((p: any) => p.is_active).length;

  const inactive = total - active;

  return {
    total,
    active,
    inactive
  };
}