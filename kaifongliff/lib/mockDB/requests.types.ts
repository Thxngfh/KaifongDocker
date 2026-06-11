
export type Status = "pending" | "in_progress" | "resolved" | "paused" | "rejected";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type SourceChannel = "WEB" | "LINE" | "PHONE" | "WALKIN" | "APP"

//---frontend--//
export interface ServiceRequest {
  //ส่วนcomplaint 
  id: string                    // complaint_id
  complaintNo: string           // complaint_no

  title: string                 // title
  detail?: string                // detail

  additional?: string           //additional แต่ยังไม่มีใน db
  category: string              // category_id (หรือ map เป็น label)
  subcategory?: string        // subcategory_id 

  status: Status         // current_status_id (map เป็น enum)

  priority?: PriorityLevel       // priority_id (map เป็น enum)

  location?: string              // location_text
  district: string              // district
  province: string              // province
  latitude?: number              // latitude
  longitude?: number             // longitude
  geocoded_at?: string          
  location_accuracy?: number,

  assignedTeamId?: string        // assigned_team_id
  assignedUserId?: string        // assigned_user_id

  isAnonymous?: boolean          // is_anonymous
  isPublicView?: boolean         // is_public_view

  dueDate?: string               // due_date
  resolvedAt?: string | null     // resolved_at
  closedAt?: string | null       // closed_at
  createdAt?: string             // created_at
  updatedAt?: string             // updated_at

  //DB: ดึงจากตารางอื่น อันนี้แค่เขียนใส่ไทป์ไม่ใช่ join ตารางแค่แยกเฉยๆ 
  source?:       SourceChannel   // channels.channel_type หรือ channels.name
  actionNote:   string          // จากworkflow_logs อิงจาก componentID 
  /*ui */
  icon?: "trash" | "bolt" | "shield" | "stop"; //ถ้าข้อมุลจริงๆ จะดึง icon มาจาก db ชื่อคือ icon แต่จริงๆคือ emoji ดึงเปน text ได้
  /*นอกเหนือตาราง complaint */
  detailMeta?: string;
  date: string  //day format form createat
   /** 0-100 progress (visual only) */
  progress: number;
  /** number of progress segments to render */
  steps?: number;
  group: "this_week" | "earlier";
  rating?: number;
  showRateAction?: boolean;
  /* รูปภาพ */
  images?: Array<{
    url?: string | null;
    filename?: string | null;
    filePath?: string | null;
  }>;
}

export interface RequestsPayload {
  user: { name: string };
  counts: { 
    all: number; 
    in_progress: number;
    resolved:    number;  
    pending:     number;  
    paused:      number; 
    rejected:    number;
  };
  requests: ServiceRequest[];
}
//--- backend db layer ---//

// ── INSERT ────────────────────────────────────────────────────────────

export interface UserPayload {
  tenant_id:    string
  line_user_id: string
  title_name:   string
  is_active:    boolean

  first_name?:   string
  last_name?:    string
  display_name?: string
  email?:        string
  phone_number?: string
  citizen_type?: string
  role_id?:      string
}

export interface ComplaintPayload {
  complaint_no:   string
  tenant_id:      string
  user_id:        string
  district:       string
  is_public_view: boolean

  channel_id?:        string
  detail?:            string
  additional_datail?: string
  category_id?:       string
  subcategory_id?:    string
  priority_id?:       string
  latitude?:          number
  longitude?:         number
  province?:          string
  geocoded_at?:       string
  location_accuracy?: number
  current_status_id?: string
  assigned_team_id?:  string
  assigned_user_id?:  string
  due_date?:          string
  resolved_at?:       string
  closed_at?:         string
}

export interface WorkflowPayload {
  complaint_id:    string
  to_status_id:    string
  action_type:     string

  action_datetime?: string //auto increment
  from_status_id?:   string | null
  action_by?:        string | null
  action_role_id?:   string | null
  action_note?:      string | null
  ip_address?:       string | null
  pending_reason?:   string | null
  assigned_team_id?: string | null
  assigned_user_id?: string | null
}

export interface ComplaintFilePayload {
  complaint_id: string
  file_name:    string
  file_path:    string
  is_primary?:   boolean //มี default
  file_type?:   string | null
  file_url?:    string | null
  file_size?:   number | null
  mime_type?:   string | null
  uploaded_by?: string | null
}

// ── SELECT ────────────────────────────────────────────────────────────
export interface UserRow extends UserPayload {
  user_id:       string
  last_login_at?: string | null
  created_at:    string
  updated_at:    string
}

export interface ComplaintRow extends ComplaintPayload {
  complaint_id: string
  created_at:   string
  updated_at:   string
  // joined
  channel_type?:  SourceChannel | null
  action_note?:   string | null
  category_icon?: string | null
}

export interface WorkflowLogRow extends WorkflowPayload {
  workflow_log_id: string
}

export interface ComplaintFileRow extends ComplaintFilePayload {
  file_id:    string
  created_at: string
}


