// lib/caseUtils.ts

// คำนวณระยะเวลาที่ใช้แก้ไข complaint โดยที่คำร้องนั้นมีสถานะเปนresolve or closed (ปิดคำร้อง) 
export function calcResolvedDuration(createdAt: string, resolvedAt: string | null ): string {
  if (!resolvedAt) return "" //ใส่กันไว้เพราะใน json ค่ามันมีสิทธิ์เปนค่าว่างได้ ts เลยไม่ยอม อนาคตปรับได้
  const diffMs = new Date(resolvedAt).getTime() - new Date(createdAt).getTime()
  return formatDuration(diffMs, "แก้ไขเสร็จสิ้นภายใน")
}

// คำนวณระยะเวลาที่รอดำเนินการ (นับจาก datetime จนถึงตอนนี้)
export function calcPendingDuration(datetime: string): string {
  return formatDuration(Date.now() - new Date(datetime).getTime(), "")
}

// จัดกลุ่ม datetime ว่าอยู่ในสัปดาห์นี้หรือก่อนหน้า
export function getGroup(datetime: string): "this_week" | "earlier" {
  // แปลง Date เป็น Bangkok time (UTC+7)
  // เช่น 2026-06-11T07:00:00Z (UTC) → 2026-06-11T14:00:00 (Bangkok)
  const toTH = (d: Date) =>
    new Date(d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }))

  const now = toTH(new Date())
  const startOfWeek = new Date(now)
  // ย้อนไปวันอาทิตย์ต้นสัปดาห์ เวลา 00:00:00
  // เช่น วันนี้พุธในเดือนวันที่ 11 → วันที่ในสัปดาห์ getDay()=3 → 11-3=8 → อาทิตย์ที่ 8 มิ.ย. 00:00:00
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // 10 มิ.ย. >= 8 มิ.ย. → "this_week"
  //  5 มิ.ย. <  8 มิ.ย. → "earlier"
  return toTH(new Date(datetime)) >= startOfWeek ? "this_week" : "earlier"
}

// แปลง ms (milliseconds) กับ prefix เป็น string ที่อ่านง่าย
// prefix มีค่า → "แก้ไขเสร็จสิ้นภายใน 2 วัน 3 ชม."
// prefix ว่าง  → "2 วัน 3 ชม. ที่แล้ว"
function formatDuration(ms: number, prefix: string): string {
  // แปลง ms → นาที → ชั่วโมง → วัน
  const totalMin = Math.floor(ms / 60000);       // ms ÷ 60,000 = นาทีทั้งหมด
  const totalHr  = Math.floor(totalMin / 60);    // นาที ÷ 60 = ชั่วโมงทั้งหมด
  const days     = Math.floor(totalHr / 24);     // ชั่วโมง ÷ 24 = วันทั้งหมด
  const hrs      = totalHr % 24;                 // ชั่วโมงที่เหลือหลังหักวัน
  const mins     = totalMin % 60;                // นาทีที่เหลือหลังหักชั่วโมง

  const parts: string[] = [];
  if (days) parts.push(`${days} วัน`);
  if (hrs)  parts.push(`${hrs} ชม.`);
  if (mins && !days) parts.push(`${mins} นาที`);  // แสดงนาทีเฉพาะตอนที่ < 1 วัน

  // ถ้าน้อยกว่า 1 นาที
  if (!parts.length) parts.push("ไม่กี่นาที");

  // มี prefix → duration ของเหตุการณ์ที่เกิดขึ้นแล้ว เช่น "แก้ไขเสร็จสิ้นภายใน 2 วัน"
  // ไม่มี prefix → ระยะเวลาที่ผ่านมา เช่น "2 วัน ที่แล้ว"
  return prefix
    ? `${prefix} ${parts.join(" ")}`
    : `${parts.join(" ")} ที่แล้ว`;
}

//ใช้เพื่อจัดรูปแบบจาก complaint no ปกติ ให้เปน รูปแบบที่อ่านง่ายมากขึ้น (REQ-ID/YEAR)
export function getComplaintNumber(complaintNo: string): string {
  const parts = complaintNo.split("-");
  // "C-202605001-0001" → ["C", "202605001", "0001"]

  const yearAD = parseInt(parts[1].substring(0, 4)); // 2026
  const year = (yearAD + 543).toString().substring(2, 4); // "69"
  const no = parts[2] ?? "0000";                    // "0001"

  const display = `REQ-${no}/${year}`;

  return display ;
}