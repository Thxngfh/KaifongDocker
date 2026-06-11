"use client"
import Navbar from "../../../components/navbar";
import UserCard from "../../../components/userform/UserCard"
import { Sarabun } from 'next/font/google';
import { useState, useEffect } from "react";
import ComplaintCard from "../../../components/ComplaintDetailsCard";
import EvidenceCard from "@/components/userform/EvidenceCard";
import StepProgress from "@/components/userform/step_progress_3";
import { MdSend } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { usePhotoStore } from "@/hooks/usePhotoStore"
import liff from "@line/liff";

const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

type User = {
  line_user_id: string;
  prefix: string;
  name: string;
  lastname: string;
  phone: string;
};

type ComplaintDetail = {
  categoryId: string;
  subcategoryId: string;
  category: string;
  subcategory: string;
  location: string;
  latitude: string;
  longitude: string;
  province: string;
  district: string;
  detail: string;
  additional: string;
  geocoded_at: string;
  location_accuracy: string;
};

// หน้ายืนยันก่อน submit คำร้อง
// ดึงข้อมูล user + complaint จาก cookie API แล้วแสดงสรุป
export default function Details() {
  const [user, setUser]     = useState<User | null>(null);
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { photos } = usePhotoStore()

  // โหลดข้อมูล user และ complaint จาก cookie ที่บันทึกไว้ในขั้นตอนก่อนหน้า
  useEffect(() => {
    Promise.all([
      fetch("/api/form/reporter").then(res => res.json()),
      fetch("/api/form/complaint").then(res => res.json()),
    ]).then(([userData, detailData]) => {
      setUser(userData);
      setDetail(detailData);
    });
  }, []);

  async function handleSubmit() {
    if (!user || !detail) return
    setIsSubmitting(true);
    setShowSuccessMessage(false);

    try {
      // 1. อัพรูปไป Vercel Blob ทุกไฟล์พร้อมกัน
      const photo = await Promise.all(
        photos.map(async file => {
          const fd = new FormData()
          fd.append("file", file)

          const res = await fetch("/api/upload", { method: "POST", body: fd })

          // log ดูว่า API return อะไรกลับมา
          const text = await res.text()
          console.log("upload response:", text)

          const dataPhoto = JSON.parse(text)
          return {
            file_url:  dataPhoto.file_url,
            file_path: dataPhoto.file_path,
            file_name: dataPhoto.file_name,
            file_type: dataPhoto.file_type,
            mime_type: dataPhoto.mime_type,
            file_size: dataPhoto.file_size,
          }
        })
      )

      // 2. POST ข้อมูลทั้งหมดลง DB ในคำสั่งเดียว (upsert user + insert complaint + files + workflow)
      const res = await fetch("/api/form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          // ข้อมูลสำหรับตาราง complaint
          complaint: {
            complaint_no: "", // C-202605001-0002 บันทึกแบบ mockdata เลย

            tenant_id: "static", // จะเป็นข้อมูลที่สร้างหลังจากดึงข้อมูลของตัวหน่วยงานได้ ตอนนี้ใช้ id ตัวเลขแบบ static ไปก่อน แก้เลขที่ตรงนี้ได้
            user_id: "", // backend ใส่เองหลังสร้าง user

            district: detail.district,
            province: detail.province,

            is_public_view: true,

            channel_id: "hhhh0000-0000-0000-0000-000000000001", // line

            category_id: detail.categoryId,
            subcategory_id: detail.subcategoryId,

            current_status_id: "ffff0000-0000-0000-0000-000000000003",

            detail: detail.detail,
            additional_datail: detail.additional,

            latitude: detail.latitude,
            longitude: detail.longitude,

            geocoded_at: detail.geocoded_at,
            // accuracy ไม่เอาแล้ว
            // time ต่างๆน่าจะอัพเดทหลังเข้า db
            // due_date resolved_at closed_at ตอนเข้ามาครั้งแรกที่มีสถานะ pending ก็ยังไม่มี
          },

          // ข้อมูลสำหรับตาราง ComplaintFile
          files: photo.map((p) => ({
            complaint_id: "", // backend ใส่เอง ดึง complaint_id ที่เพิ่งสร้างเป็น lastID

            file_name: p.file_name,

            file_path: p.file_path, // complaints/{complaint_id}/{file_id}.{ext} ใส่ตอนมี server ถ้ามี path ใหม่ตาม server ก็เปลี่ยนตามนั้น

            is_primary: false,

            file_type: p.file_type,
            file_url:  p.file_url,
            file_size: p.file_size,
            mime_type: p.mime_type,

            uploaded_by: null,
          })),

          // ข้อมูลสำหรับตาราง workflow
          workflow: {
            workflow_log_id: "รอ auto uuid ไม่ใช้",

            complaint_id: "auto จาก complaint ที่เพิ่งสร้าง",

            from_status_id: null, // ตอนสร้างใหม่ยังไม่มีสถานะก่อนหน้า

            to_status_id: "ffff0000-0000-0000-0000-000000000003", // สำหรับ mockData คือ pending

            action_type: "SUBMIT", // ตอน null → pending

            action_by: "ได้มาจากตอนดึง auto increment userID ของ complaint",

            action_role_id: "ประชาชน", // บทบาทคือใครเป็นคนกระทำ
            action_note: "รอดำเนินการ",

            ip_address: null, // ยังไม่ใช้หรืออาจจะไม่ได้ใช้เลย
            assigned_team_id: null,
            assigned_user_id: null,
          },

          // ข้อมูลสำหรับตาราง user
          // upsert ด้วย line_user_id เพื่อให้ 1 line account มีได้หลาย complaint
          user: {
            tenant_id: "static",

            line_user_id: user.line_user_id || "authen", // ได้จาก authen

            title_name: user.prefix,
            first_name: user.name,
            last_name:  user.lastname,
            phone_number: user.phone,

            is_active: true,
          },

          // ก็คือต้องเก็บ fullname phone ในตาราง user อีก userId ก็จะเพิ่มแถวข้อมูล user ในดาต้าเบส โดยที่มี lineID ซ้ำกัน
          // ดังนั้น เวลาดึงข้อมูล เมื่อรับ lineId ผ่าน authen ก็จะได้ข้อมูลที่เกี่ยวกับ user และ complaint ทั้งหมดใน lineId นั้นๆ
          // และแยก log ตาม complaintID ผ่าน userID
        })
      })

      const data = await res.json()
      console.log("submit response:", data)

      setShowSuccessMessage(true);

      // ถ้าอยู่ใน LIFF → ปิดหน้าต่าง, ถ้าไม่ใช่ → reload
      setTimeout(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        } else {
          window.location.reload();
        }
      }, 1200);

    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user || !detail) 
    return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#725C00]/20 border-t-[#725C00]" />
      <p className="text-sm font-medium text-[#725C00]">กำลังโหลด...</p>
    </div>
  );

  return (
    <div className={`${sarabun.className} mobile-viewport`}>
      <Navbar />
      <StepProgress />
      <div className="flex flex-col mx-auto gap-6 max-w-3xl px-5 sm:px-8">
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">ยืนยันรายละเอียด</h1>
          <p className="text-md font-medium text-[#4D4632]/80">Confirmation</p>
          <p className="text-sm font-medium text-[#4D4632]/80">กรุณาใส่รายละเอียดให้ถูกต้องและครบถ้วน</p>
        </div>

        <UserCard
          name={user.name}
          lastname={user.lastname}
          phone={user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
        />
        <ComplaintCard formData={{
          category:    detail.category,
          location:    detail.location,
          detail:      detail.detail,
          subcategory: detail.subcategory,
          additional:  detail.additional,
        }} />
        <EvidenceCard />

        {/* overlay loading / success */}
        {(isSubmitting || showSuccessMessage) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
            <div className={`w-full max-w-sm rounded-3xl border px-5 py-4 text-sm shadow-[0_20px_45px_-20px_rgba(0,0,0,0.25)] backdrop-blur-sm ${showSuccessMessage ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900' : 'border-amber-300 bg-amber-50/95 text-amber-950'}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-2 font-medium text-center">
                  <span>{isSubmitting ? '⌛ กำลังโหลดข้อมูล โปรดรอสักครู่...' : '✅ ส่งข้อมูลสำเร็จแล้ว'}</span>
                </div>
                <p className={`text-center text-xs ${showSuccessMessage ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isSubmitting ? 'ระบบกำลังประมวลผลและอัปโหลดข้อมูลของคุณ' : 'กำลังปิดหน้าต่างอัตโนมัติ'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${showSuccessMessage ? 'bg-emerald-700' : 'bg-amber-700'}`} style={{ animationDelay: '0ms' }} />
                  <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${showSuccessMessage ? 'bg-emerald-700' : 'bg-amber-700'}`} style={{ animationDelay: '120ms' }} />
                  <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${showSuccessMessage ? 'bg-emerald-700' : 'bg-amber-700'}`} style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ปุ่มยืนยัน disabled ถ้ายังไม่มีรูปหรือกำลัง submit */}
        <div className='flex items-center justify-center w-full mb-4'>
          <button
            type="button"
            disabled={!photos.length || isSubmitting}
            onClick={handleSubmit}
            className={`bg-nt text-[#725C00] rounded-full px-6 py-3 mt-6 font-bold w-100 h-14 shadow-xl shadow-[#FF8A65]/35 transition duration-300 ease-in-out flex items-center justify-center space-x-2 ${(!photos.length || isSubmitting) ? 'cursor-not-allowed opacity-60' : 'hover:cursor-pointer hover:bg-nt/70'}`}
          >
            <div className='flex items-center justify-center text-xl'>
              <span className='mr-2 px-3'>
                {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการแจ้งเหตุ'}
              </span>
              <span className='text-xl'><MdSend /></span>
            </div>
          </button>
        </div>

        <Link href="/userform/Complaint_Details">
          <div className="flex gap-2 justify-center mr-3 text-link-text font-bold">
            <div className="mt-1"><FaArrowLeft /></div>
            <span className="mb-5">ย้อนกลับแก้ไข (Back)</span>
          </div>
        </Link>
      </div>
    </div>
  )
}



