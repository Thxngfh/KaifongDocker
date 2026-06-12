"use client"

import React, { useState, useMemo, useEffect } from "react"
import ComplaintToolbar from "@/components/ui/Admin_director/ComplainToolbar"
import ComplaintPagination from "@/components/ui/Admin_director/PageNavigation"
import ComplaintTable from "./table/complainTable"
import { complaints } from "./table/data"
import { Sarabun } from "next/font/google"
import EvaluateFilterModal from "../../../components/ui/Director/Filtermodal"

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
  { key: "types", title: "ประเภทปัญหา"}
]

const problemImageMap: Record<string, string> = {
  "ไฟฟ้าขัดข้อง": "⚡",
  "ถนนชำรุด": "🛣️",
  "น้ำประปาขัดข้อง": "💧",
  "ขยะและสิ่งแวดล้อม": "🗑️",
  "ต้นไม้และพื้นที่สาธารณะ": "🌳",
  "ท่อระบายน้ำ": "🕳️",
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])

  const pageSize = 5

  const statusOptions = Array.from(
    new Set(complaints.map((item) => item.status))
  )

  const problemOptions = Object.keys(problemImageMap)

  const filteredData = useMemo(() => {
    let result = complaints

    if (activeTab === "pending") {
      result = result.filter(
        (item) => item.status === "กำลังดำเนินการ"
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
  }, [activeTab, search, selectedStatus, selectedProblems])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab, selectedStatus, selectedProblems])

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