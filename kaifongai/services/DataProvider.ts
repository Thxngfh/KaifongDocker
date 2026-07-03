/*
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
*/
export interface Case {
  // fields เก่า (เก็บไว้เพื่อ compatibility)
  id?: string;
  user_id?: string;
  problem_id?: string;
  datetime?: string;
  status?: string;
  description?: string;
  location?: string;
  picture_url?: string;

  // fields จาก PostgreSQL จริง
  complaint_id?: string;
  complaint_no?: string;
  title?: string;
  detail?: string;
  district?: string;
  province?: string;
  created_at?: string;
  updated_at?: string;
  status_code?: string;
  status_name?: string;
  category_name?: string;
  subcategory_name?: string;
  priority_code?: string;
  priority_name?: string;
  channel_name?: string;
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
  id: string;
  name: string;
  description: string;
  is_active?: boolean
}
export interface case_status_log {
  id: string,
  case_id: string,
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