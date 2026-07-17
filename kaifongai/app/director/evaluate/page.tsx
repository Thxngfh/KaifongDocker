"use client"

import React, { useState, useMemo, useEffect } from "react"
import ComplaintToolbar from "@/components/ui/Admin_director/ComplainToolbar"
import ComplaintPagination from "@/components/ui/Admin_director/PageNavigation"
import ComplaintTable from "./table/complainTable"
import { Sarabun } from "next/font/google"
import EvaluateFilterModal from "../../../components/ui/Director/Filtermodal"
import type { Complaint } from "./table/complain"

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
})

const columns = [
  { key: "id", title: "ลำดับ" },
  { key: "problems", title: "เลขส่วนกลาง-เลขรับ" },
  { key: "app", title: "ช่องทาง" },
  { key: "title", title: "เรื่องร้องทุกข์" },
  { key: "person", title: "ผู้ยื่นคำร้อง" },
  { key: "phone", title: "ติดต่อ" },
  { key: "status", title: "สถานะ" },
  { key: "staff", title: "เจ้าหน้าที่ที่รับผิดชอบ" },
]

const problemImageMap: Record<string, string> = {
  "โครงสร้างพื้นฐานและสาธารณูปโภค": "🏗️",
  "สิ่งแวดล้อมและสุขาภิบาล": "🗑️",
  "สาธารณสุขและมลพิษ": "🏥",
  "ความเป็นระเบียบเรียบร้อยและจราจร": "🚦",
  "สวัสดิการสังคมและพัฒนาชุมชน": "🏘️",
  "การบริการเจ้าหน้าที่และธรรมาภิบาล": "📋",
};
/*
function mapChannel(code: string): "Line" | "Web" | "App" {
  if (code === "LINE_LIFF") return "Line"
  if (code === "WEB") return "Web"
  return "App" // Call Center / อื่นๆ
}

function mapStatus(code: string): "กำลังดำเนินการ" | "ประเมินผลเสร็จสิ้น" | "ไม่รับเรื่อง" {
  if (code === "IN_PROGRESS") return "กำลังดำเนินการ"
  if (code === "RESOLVED" || code === "CLOSED") return "ประเมินผลเสร็จสิ้น"
  return "ไม่รับเรื่อง" // PENDING / PAUSED / REJECTED
}
*/
export default function Page() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const pageSize = 5

  const statusOptions = Array.from(
    new Set(complaints.map((item) => item.status))
  )

  const problemOptions = Object.keys(problemImageMap)

  const filteredData = useMemo(() => {
    let result = complaints

    if (activeTab === "pending") {
      result = result.filter(
        (item) => item.status === "รอดำเนินการ"
      )
    }

    //ถ้าพี่เขาให้แก้serch filterให้มาแก้ที่นี่ว่าอยากให้serch
    if (search.trim()) {
      result = result.filter(
        (item) =>
          item.problems.toLowerCase().includes(search.toLowerCase()) ||
          item.person.toLowerCase().includes(search.toLowerCase()) ||
          item.staff.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedStatus.length > 0) {
      result = result.filter((item) =>
        selectedStatus.includes(item.status)
      )
    }

    if (selectedProblems.length > 0) {
      result = result.filter((item) =>
      selectedProblems.includes(item.types)
    )
  }

    return result
  }, [complaints, activeTab, search, selectedStatus, selectedProblems])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab, selectedStatus, selectedProblems])

  useEffect(() => {
    fetch("/api/evaluate")
      .then((res) => res.json())
      .then((rows) => {
        // API ทำ mapping field และสถานะเป็นภาษาไทยให้แล้ว ใช้ตรงๆ ได้เลย
        setComplaints(rows as Complaint[])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Fetch error:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className={`${thaiFont.className} min-h-screen bg-background`}>
      <div className="w-full px-8 py-8 mx-auto">

        <h1 className="text-3xl font-bold text-[#333847] mb-7 ml-10">
          รายการคำร้องทุกข์
        </h1>

        <ComplaintToolbar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={() => setIsFilterOpen(true)}
          onExportClick={() => console.log("export")}
        />

      <EvaluateFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}

        statusOptions={statusOptions}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}

        problemOptions={problemOptions}
        selectedProblems={selectedProblems}
        setSelectedProblems={setSelectedProblems}
      />

        <ComplaintTable
          columns={columns}
          data={paginatedData}
        />

        <ComplaintPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}