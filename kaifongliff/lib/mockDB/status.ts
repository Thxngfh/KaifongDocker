import type { Status } from "@/lib/mockDB/requests.types";

// UI config ทั้งหมดในไฟล์นี้เป็น static ไม่เกี่ยว DB

// ชื่อสถานะภาษาไทยสำหรับแสดงผล
export const STATUS_LABEL: Record<Status, string> = {
  in_progress: "กำลังดำเนินการ",
  pending:     "รอดำเนินการ",
  resolved:    "เสร็จสิ้น",
  paused:      "พักงาน",
  rejected:    "ถูกปฎิเสธ"
};

// Tailwind class สำหรับ pill/badge แสดงสถานะ
export const STATUS_PILL: Record<Status, string> = {
  in_progress: "text-status-progress bg-status-progress/10",
  pending:     "text-status-pending bg-status-pending/15",
  resolved:    "text-status-done bg-status-done/10",
  paused:      "text-muted-foreground bg-muted",
  rejected:    "text-red-700 bg-red-50",
};

// Tailwind class สำหรับ accent bar ข้างซ้าย RequestCard
export const STATUS_ACCENT: Record<Status, string> = {
  in_progress: "bg-status-progress",
  pending:     "bg-status-pending",
  resolved:    "bg-status-done",
  paused:      "bg-status-paused",
  rejected:    "bg-red-400",
};

// Tailwind class สำหรับ icon tile ใน StatusCard (พื้นหลัง + สีไอคอน)
export const STATUS_ICON_TILE: Record<Status, string> = {
  in_progress: "bg-status-progress/10 text-status-progress",
  pending:     "bg-status-pending/15 text-status-pending",
  resolved:    "bg-status-done/10 text-status-done",
  paused:      "bg-muted text-foreground",
  rejected:    "bg-red-50 text-red-700",
};

// เปอร์เซ็นต์ความคืบหน้าสำหรับ progress bar (0-100)
export const STATUS_PROGRESS: Record<Status, number> = {
  pending:     33.33,
  in_progress: 66.66,
  resolved:    100,
  paused:      66.66,
  rejected:    33.33
};

//pill/badge → ป้ายสถานะ
//accent bar → แถบสีข้างซ้าย