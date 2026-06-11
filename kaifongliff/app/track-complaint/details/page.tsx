"use client"
import Navbar from "../../../components/navbar";
import UserCard from "../../../components/userform/UserCard"
import { Sarabun } from 'next/font/google';
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import ComplaintCard from "../../../components/ComplaintDetailsCard";
import EvidenceCard from "@/components/userform/EvidenceCard";
import StatusCard from "@/components/complaint/StatusCard";
import { FaArrowLeft } from "react-icons/fa";
import type { ServiceRequest, UserPayload } from "@/lib/mockDB/requests.types";
import Link from "next/link";

const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

// ข้อมูลที่ API ส่งมารวม ServiceRequest + UserPayload ไว้ด้วยกัน
type ComplaintDetail = Partial<ServiceRequest> & Partial<UserPayload>

// หน้ารายละเอียดคำร้อง ดึงข้อมูลด้วย id จาก query string
function Details() {
  const [request, setRequest] = useState<ComplaintDetail | null>(null)
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (!id) return
    fetch(`/api/complaint/${id}`)
      .then(r => r.json())
      .then(setRequest)
  }, [id])

  // ถ้ายังไม่มีรูป → ใช้รูป placeholder แทน
  const evidencePhotos = request?.images?.length
    ? request.images
    : [{ url: "/evidence/add_photo.png" }];

  // loading state
  if (!request) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#725C00]/20 border-t-[#725C00]" />
      <p className="text-sm font-medium text-[#725C00]">กำลังโหลด...</p>
    </div>
  );

  return (
    <div className={`${sarabun.className} min-h-screen`}>
      <Navbar />
      <div className="flex flex-col mx-auto gap-6 max-w-3xl px-5 sm:px-8">
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">รายละเอียดงาน</h1>
          <p className="text-md font-medium text-[#4D4632]/80">Confirmation</p>
        </div>

        <UserCard
          name={request?.first_name ?? ""}
          lastname={request?.last_name ?? ""}
          phone={request?.phone_number?.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3") ?? ""}
        />
        <ComplaintCard request={request as ServiceRequest} />
        <EvidenceCard photos={evidencePhotos} />
        <StatusCard request={request as ServiceRequest} />

        <Link href="/track-complaint/complaint">
          <div className="flex gap-6 justify-center mr-3 text-link-text font-bold">
            <div className="mt-1"><FaArrowLeft /></div>
            <span className="mb-5">ย้อนกลับ (Back)</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Suspense จำเป็นเพราะ useSearchParams() ต้องการ Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#725C00]/20 border-t-[#725C00]" />
        <p className="text-sm font-medium text-[#725C00]">กำลังโหลด...</p>
      </div>
    }>
      <Details />
    </Suspense>
  )
}

