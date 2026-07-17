"use client"

import { useEffect, useState } from "react"
import { useParams, notFound } from "next/navigation"
import StatusBadge2 from "../../table/StatusBadge2"
import SummaryCardLong from "@/components/ui/Director/SummaryCardLong"
import CardMap from "@/components/ui/Director/CardMap"
import CardDetail from "@/components/ui/Director/CardDetail"
import { Sarabun } from "next/font/google"
import { Complaint, ComplaintChannel, ComplaintStatus } from "../../table/complain"

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
})

function mapChannel(code: string): ComplaintChannel {
  if (code === "LINE_LIFF") return "Line"
  if (code === "WEB") return "Web"
  return "App"
}

function mapStatus(code: string): ComplaintStatus {
  switch (code) {
    case "PENDING":
      return "รอดำเนินการ"

    case "IN_PROGRESS":
      return "กำลังดำเนินการ"

    case "RESOLVED":
    case "CLOSED":
      return "เสร็จสิ้น"

    case "PAUSED":
      return "พักงาน"

    case "REJECTED":
      return "ถูกปฏิเสธ"

    default:
      return "รอดำเนินการ"
  }
}

export default function DetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/table/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFoundState(true)
          return null
        }
        return res.json()
      })
      .then((r) => {
        if (!r) return
        const mapped: Complaint = {
          id: r.complaint_id,
          problems: r.complaint_no,
          app: mapChannel(r.channel_code ?? r.channel_name),
          title: r.title,
          person: r.reporter_name ?? "-",
          phone: r.reporter_phone ?? "-",
          status: mapStatus(r.status_code ?? r.status_name),
          staff: r.staff_name ?? "ยังไม่มอบหมาย",
          types: r.subcategory_name ?? "-",
        }
        setComplaint(mapped)
      })
      .catch((err) => {
        console.error("Fetch error:", err)
        setNotFoundState(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className={`${thaiFont.className} p-10 text-center text-gray-400`}>
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (notFoundState || !complaint) {
    notFound()
    return null
  }

  return (
    <div className={` ${thaiFont.className} w- h-full px-10 mx-8 flex flex-col gap-6 mt-3`}>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mt-2">
            <h1 className="text-3xl font-bold text-[#333847]">
              รายละเอียดคำร้อง
            </h1>
            <h1 className="text-3xl font-bold text-[#725C00]">
              {complaint.problems}
            </h1>
          </div>

          <div className="mt-6">
            <StatusBadge2 status={complaint.status} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 mr-14 mt-8 font-bold">
          <div className="flex gap-3 text-[14px]">
            <button className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition cursor-pointer">
              ประวัติคำร้อง
            </button>

            <button className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition cursor-pointer">
              ดูผลการดำเนินการ
            </button>
          </div>

          <button className=" text-[14px] rounded-xl bg-accent mr-19 px-8 py-2.5 text-black hover:bg-yellow-500 transition cursor-pointer">
            ประเมินการปฏิบัติงาน
          </button>
        </div>
      </div>

      <div className="mr-10 mt-10">
        <SummaryCardLong
          title_app="ข้อมูลการรับเรื่อง"
          title_number="เลขที่รับ"
          title_comment="หมายเหตุ"
          title_department="หน่วยงาน"
          title_status="สถานะ"
          title_time="เวลา"
          value_app={complaint.app}
          value_comment="เร่งด่วนเป็นพิเศษ"
          value_department="ฝ่ายเทคโนโลยีสารสนเทศ"
          value_number={complaint.problems}
          value_status={complaint.status}
          value_time="14.20 น."
        />
      </div>

      <div className="mb-10 pr-8">
        <div className="flex flex-row gap-6">
          <div className="flex-2">
            <CardDetail />
          </div>
          <div className="flex-3">
            <CardMap />
          </div>
        </div>
      </div>
    </div>
  )
}