"use client";
import { useEffect, useState } from "react";
import SummaryCard from "../../../components/ui/Admin_director/SummaryCard";
import DataTable from "@/components/ui/Admin_director/DataTableBase"
import { Member } from "@/services/memberData"
import ComplaintPagination from "@/components/ui/Admin_director/PageNavigation";
import OptionsMenu from "@/components/ui/Admin_director/OptionMenu";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";
import FilterButton from "@/components/ui/Admin_director/FilterButton"
import { Sarabun } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";

const monoFont = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
})

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});



//สำหรับใส่ค่าส่งไปที่ components card ต่างๆ อิงส่วน ui และเนื้อหาจากหน้า ที่เป็นส่วนคำนวณ

interface SummaryData {
  requestToday: number;
  pending: number;
  rejected: number;
  approved: number;
  avgApproveHours: number;
}

function MemberApproval() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [tableData, setTableData] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const [buttonStates, setButtonStates] = useState<{ [id: number]: string }>({});

  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

  const filteredData = tableData.filter((item) => item.status === statusFilter);
  const pageData = filteredData.slice((currentPage - 1) * limit, currentPage * limit);
  const totalPages = Math.ceil(filteredData.length / limit);

  //หัวตาราง 
  const columns =
    statusFilter === "pending"
      ? [
        { key: "id", title: "ลำดับ" },
        { key: "name", title: "ชื่อ-นามสกุล / อีเมลล์" },
        { key: "department", title: "หน่วยงาน" },
        { key: "time", title: "วันที่สมัคร" },
        { key: "status", title: "สถานะ" },
      ]
      : [
        { key: "id", title: "ลำดับ" },
        { key: "name", title: "ชื่อ-นามสกุล / อีเมลล์" },
        { key: "department", title: "หน่วยงาน" },
        { key: "time", title: "วันที่สมัคร" },
        { key: "status", title: "สถานะ" },
        { key: "updated", title: "วันที่ดำเนินการ" },
      ];

  function formatThaiDate(dateString: string) {
    const date = new Date(dateString);

    // กำหนด options
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short", // ต.ค., ม.ค. ฯลฯ
      year: "numeric",
    };

    // แปลงเป็น locale "th-TH"
    const formatted = date.toLocaleDateString("th-TH", options);

    return formatted;
  }
  const Summary = {
    topCards: [
      {
        title: "คำขอวันนี้",
        value: summary?.requestToday ?? 0,
        subvalue: "",
        color: "#725C00",
      },
      {
        title: "รอดำเนินการ",
        value: summary?.pending ?? 0,
        subvalue: "",
        color: "#575E72",
      },
      {
        title: "ถูกปฏิเสธ",
        value: summary?.rejected ?? 0,
        subvalue: "",
        color: "#EF4444",
      },
      {
        title: "อนุมัติแล้ว",
        value: summary?.approved ?? 0,
        subvalue: "",
        color: "#22C55E",
      },
      {
        title: "ความเร็วอนุมัติเฉลี่ย",
        value: `${summary?.avgApproveHours ?? 0} ชม.`,
        subvalue: "",
        color: "#EDC200",
      },
    ],
  };

  const fetchData = async () => {
    const res = await fetch("/api/member-approval/table");
    const members: Member[] = await res.json();

    const formatted = members.map((m) => ({
      ...m,
      datetime: formatThaiDate(m.datetime),
    }));

    setTableData(formatted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSummary = async () => {
    const res = await fetch("/api/member-approval/summary");
    const data = await res.json();
    setSummary(data);
  };
  useEffect(() => {
    fetchSummary();
  }, []);


  return (
    <div className={`${thaiFont.className} h-screen bg-background`}>
      <div className="w-full px-8 py-8 mx-auto">

        <div className="w-full flex justify-between mr-24">
          <h1 className="text-3xl font-bold text-[#333847] mb-3 pl-10">อนุมัติสมาชิก</h1>
          <div className="ml-6 relative">
            <FilterButton onClick={() => setShowFilter(!showFilter)} />

            {showFilter && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 ">

                <button
                  onClick={() => {
                    setStatusFilter("pending");
                    setCurrentPage(1);
                    setShowFilter(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 "
                >
                  รอดำเนินการ
                </button>

                <button
                  onClick={() => {
                    setStatusFilter("approved");
                    setCurrentPage(1);
                    setShowFilter(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 "
                >
                  อนุมัติแล้ว
                </button>

                <button
                  onClick={() => {
                    setStatusFilter("rejected");
                    setCurrentPage(1);
                    setShowFilter(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-100"
                >
                  ปฏิเสธ
                </button>


              </div>
            )}
          </div>
        </div>

        <p className="text-xl text-muted-foreground mb-12 mx-10 ">ตรวจสอบและยืนยันตัวตนผู้ขอใช้งานระบบใหม่</p>
        {/*การ์ดส่วน1*/}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 ml-10 mt-10">
          {Summary?.topCards?.map((item, index) => (
            <SummaryCard
              key={index}
              title={item.title}
              value={item.value}
              subvalue={item.subvalue}
              color={item.color}
            />
          ))}
        </div>

        {/* table */}
        <div className="overflow-x-auto mt-10 ml-6">
          <DataTable columns={columns}>
            <tbody>
              {pageData.map((row, index) => (
                <tr key={row.id} className="h-20">
                  <td className={` ${monoFont.className} px-8 py-4 text-[#4D4632]`}> {String((currentPage - 1) * limit + index + 1).padStart(2, "0")}</td>
                  {/* ลำดับ
                  <td className="px-8 py-4 text-[#4D4632]">
                    {String((currentPage - 1) * limit + index + 1).padStart(2, "0")}
                  </td> */}

                  {/* ชื่อ */}
                  <td className="px-8 py-4">
                    <p className="font-bold">
                      {row.name} {row.lastname}
                    </p>
                    <p className="text-xs text-[#3D4457]">{row.email}</p>
                  </td>

                  {/* หน่วยงาน */}
                  <td className="px-6 py-4 text-[#4D4632]">
                    {row.department}
                  </td>

                  {/* วันที่สมัคร */}
                  <td className="px-6 py-4 text-[#4D4632]">
                    {row.datetime}
                  </td>

                  {/* สถานะ */}
                  <td className="px-6 py-4">
                    <div
                      className={`rounded-2xl w-24 h-8 font-bold flex items-center justify-center text-xs
            ${row.status === "approved"
                          ? "bg-green-500/40 text-green-800"
                          : row.status === "rejected"
                            ? "bg-red-500/40 text-red-800"
                            : "bg-yellow-400/30 text-yellow-800"
                        }`}
                    >
                      {row.status === "approved"
                        ? "อนุมัติแล้ว"
                        : row.status === "rejected"
                          ? "ปฏิเสธ"
                          : "รอดำเนินการ"}
                    </div>
                  </td>

                  {/* pending = ปุ่มจัดการ */}
                  {statusFilter === "pending" ? (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-10">
                        <button
                          className={`rounded-lg w-24 h-8 text-white cursor-pointer transition-all
                ${(buttonStates[row.id] || "อนุมัติ") === "อนุมัติ"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-600 hover:bg-red-700"
                            }`}
                          onClick={async () => {
                            const val =
                              buttonStates[row.id] || "อนุมัติ";

                            const newStatus =
                              val === "อนุมัติ"
                                ? "approved"
                                : "rejected";

                            await fetch(
                              "/api/member-approval/update-table",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type":
                                    "application/json",
                                },
                                body: JSON.stringify({
                                  id: row.id,
                                  status: newStatus,
                                }),
                              }
                            );

                            await fetchData();
                            await fetchSummary();

                          }}
                        >
                          <div className="flex items-center justify-center mr-2">
                            {(buttonStates[row.id] ||
                              "อนุมัติ") ===
                              "อนุมัติ" ? (
                              <IoIosCheckmark className="w-6 h-6" />
                            ) : (
                              <IoIosClose className="w-6 h-6" />
                            )}

                            {buttonStates[row.id] || "อนุมัติ"}
                          </div>
                        </button>

                        <OptionsMenu
                          options={[
                            "อนุมัติ",
                            "ปฏิเสธ",
                          ]}
                          defaultValue={
                            buttonStates[row.id] ||
                            "อนุมัติ"
                          }
                          onSelect={(val: string) => {
                            setButtonStates((prev) => ({
                              ...prev,
                              [row.id]: val,
                            }));
                          }}
                        />
                      </div>
                    </td>
                  ) : (
                    /* approved / rejected = วันที่อัปเดต */
                    <td className="px-6 py-4 text-[#4D4632]">
                      {row.approve_at
                        ? formatThaiDate(row.approve_at)
                        : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
        <div className="flex justify-center mt-6 ">
          <ComplaintPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

        </div>
      </div>
    </div>

  )
}

export default MemberApproval;