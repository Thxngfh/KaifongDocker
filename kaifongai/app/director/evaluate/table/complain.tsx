export type ComplaintStatus =
  | "กำลังดำเนินการ"
  | "ประเมินผลเสร็จสิ้น"
  | "ไม่รับเรื่อง"

export type ComplaintChannel = "Line" | "App" | "Web"

export type Complaint = {
  id: string
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