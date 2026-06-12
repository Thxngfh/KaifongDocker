"use client";
import { complaints } from "../../table/data"
import { notFound } from "next/navigation"
import StatusBadge2 from "../../table/StatusBadge2"
import SummaryCard from "@/components/ui/Admin_director/SummaryCard"
import SummaryCardLong from "@/components/ui/Director/SummaryCardLong";
import CardMap from "@/components/ui/Director/CardMap";
import CardDetail from "@/components/ui/Director/CardDetail";
import { Sarabun} from "next/font/google";

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function DetailPage({ params }: Props) {
  const { id } = await params

  const complaint = complaints.find((item) => item.id === id)

  if (!complaint) {
    notFound()
  }
return (
  <div className={` ${thaiFont.className} w- h-full px-10 mx-8 flex flex-col gap-6 mt-3`}>
    
    {/* HEADER */}
    <div className="flex items-center justify-between">
      {/* ซ้าย */}
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

      {/* ขวา */}
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

    {/* CARD อยู่ล่าง */}
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
    // <div className="p-8">
    //   <h1 className="text-2xl font-bold">{complaint.title}</h1>
    //   <p>เลขรับเรื่อง: {complaint.problems}</p>
    //   <p>ผู้ยื่น: {complaint.person}</p>
    //   <p>เบอร์โทร: {complaint.phone}</p>
    //   <p>สถานะ: {complaint.status}</p>
    //   <p>เจ้าหน้าที่: {complaint.staff}</p>
    //   <p>ช่องทาง: {complaint.app}</p>
    //   <p>รายละเอียด: {complaint.description ?? "-"}</p>
    //   <p>สถานที่: {complaint.location ?? "-"}</p>
    //   <p>วันที่สร้าง: {complaint.createdAt ?? "-"}</p>
    // </div>
}