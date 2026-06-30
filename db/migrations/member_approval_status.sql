-- Migration: เพิ่มระบบสถานะการอนุมัติสมาชิกใหม่ (Member Approval Status)
-- จุดประสงค์: แยกความหมายของ "สถานะการอนุมัติ" (status) ออกจาก "การเปิด/ปิดใช้งาน" (is_active)
--           เพื่อรองรับ flow การอนุมัติสมาชิกใหม่ (pending -> approved / rejected)

BEGIN;

-- เพิ่มคอลัมน์ status เก็บสถานะการอนุมัติ
-- ตั้ง default เป็น 'approved' เพื่อไม่กระทบ user เดิมที่มีอยู่แล้วในระบบ (ถือว่าอนุมัติแล้วทั้งหมด)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status character varying(20) NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- เพิ่มคอลัมน์ approved_at เก็บเวลาที่อนุมัติ (ใช้คำนวณ avgApproveHours)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approved_at timestamp without time zone;

-- เพิ่มคอลัมน์ approved_by เก็บว่าใครเป็นคนอนุมัติ (เผื่อใช้ audit ทีหลัง)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- สำหรับ user เดิมที่มีอยู่แล้ว (status = approved ตาม default) ให้ใช้ created_at เป็น approved_at
UPDATE users
SET approved_at = created_at
WHERE status = 'approved' AND approved_at IS NULL;

COMMIT;