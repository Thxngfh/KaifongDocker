export type ComplaintStatus =
  | "รอดำเนินการ"
  | "กำลังดำเนินการ"
  | "เสร็จสิ้น"
  | "พักงาน"
  | "ถูกปฏิเสธ"

export type ComplaintChannel = "Line" | "App" | "Web"

export type Complaint = {
  id: string
  complaintId?: string
  problems: string
  app: ComplaintChannel
  title: string
  person: string
  phone: string
  status: ComplaintStatus
  staff: string
  types: string

  description?: string
  location?: string
  createdAt?: string
  imageUrl?: string
}