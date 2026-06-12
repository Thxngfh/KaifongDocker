"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/ui/Admin_director/DataTableBase"
import ComplaintPagination from "@/components/ui/Admin_director/PageNavigation";
import IOSSwitch from "@/components/ui/Admin_director/Toggle";
import DeleteButton from "@/components/ui/Admin_director/DeleteButton"
import EditButton from "@/components/ui/Admin_director/EditButton"
import AddButton from "@/components/ui/Admin_director/AddButton";
import SimpleDropDown from "@/components/ui/Admin_director/SimpleDropDown";
import SearchInput from "@/components/ui/Admin_director/Search";
import AddProblemTypeModal from "@/components/ui/Admin_director/ProblemTypeModal";
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

export interface Problem {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    total_cases: number;
};

export interface ProblemSummary {
    total: number;
    active: number;
    inactive: number;
};

function ProblemType() {
    const [summary, setSummary] = useState<ProblemSummary | null>(null);
    const [tableData, setTableData] = useState<Problem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 5;


    //search
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [search, setSearch] = useState("");

    //filter
    const [statusFilter, setStatusFilter] = useState("");




    const [pendingRemoval, setPendingRemoval] = useState<Set<number>>(new Set());

    const filteredData = tableData.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

        // row ที่เพิ่ง toggle → ค้างไว้ก่อน ไม่ filter ออก
        if (pendingRemoval.has(item.id)) return matchSearch;

        const matchStatus =
            statusFilter === "" ? true
                : statusFilter === "active" ? item.is_active
                    : !item.is_active;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredData.length / limit);
    const pageData = filteredData.slice((currentPage - 1) * limit, currentPage * limit);





    //หัวตาราง 
    const columns = [
        { key: "index", title: "ลำดับ" },
        { key: "name", title: "ชื่อประเภท" },
        { key: "description", title: "คำอธิบาย" },
        { key: "count", title: "จำนวนคำร้องเรียน" },
        { key: "manage", title: "จัดการ" },
    ];

    const problemImageMap: Record<string, string> = {
        "ไฟฟ้าขัดข้อง": "⚡",
        "ถนนชำรุด": "🛣️",
        "น้ำประปาขัดข้อง": "💧",
        "ขยะและสิ่งแวดล้อม": "🗑️",
        "ต้นไม้และพื้นที่สาธารณะ": "🌳",
        "ท่อระบายน้ำ": "🕳️",
    };



    useEffect(() => {
        fetch("/api/problem-type/table")
            .then((res) => res.json())
            .then((json) => {
                console.log("json:", json);
                console.log("json.data:", json.data);
                setTableData(json.data);
                setTableData(json.data);
            })
            .catch((err) => console.error("Fetch error:", err));
    }, []);

    useEffect(() => {
        fetch("/api/problem-type/summary")
            .then(res => res.json())
            .then(json => {
                setSummary(json.data);
            })
            .catch(err => console.error("Fetch error:", err));
    }, []);







    return (
        <div className={`${thaiFont.className} h-screen bg-background`}>
            <div className="w-full px-8 py-8 mx-auto">

                <h1 className="text-3xl font-bold text-[#333847] mb-3 pl-10">จัดการประเภทปัญหา</h1>

                <div className="w-full flex justify-between mr-24">
                    <p className="text-xl text-muted-foreground  mx-10 ">ทั้งหมด{" "}{tableData.length}{" "}ประเภท</p>
                    <div className="ml-6"><AddButton onClick={() => { setEditingItem(null); setOpenModal(true); }} />
                        <AddProblemTypeModal
                            isOpen={openModal}
                            onClose={() => setOpenModal(false)}
                            initialData={editingItem}
                        />
                    </div>
                </div>

                <div className={` ${monoFont.className} flex gap-3 mb-6 ml-10 mt-4`}>
                    <div className="text-center px-4 py-2 rounded-full bg-gray-200 border border-gray-300 text-gray-600 font-bold">
                        ทั้งหมด{" "}{summary?.total ?? 0}
                    </div>

                    <div className="text-center px-4 py-2 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-900 font-bold">
                        เปิดใช้งาน{" "}{summary?.active ?? 0}
                    </div>

                    <div className="text-center px-4 py-2 rounded-full bg-red-100 border border-red-200 text-red-800 font-bold">
                        ปิดใช้งาน{" "}{summary?.inactive ?? 0}
                    </div>
                </div>
                <div className="ml-10 flex justify-between mt-14">
                    <div className="flex gap-6">
                        <SearchInput
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <SimpleDropDown
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                </div>
                {/* table */}
                <div className="overflow-x-auto mt-10 ml-6 shadow-xl rounded-2xl">
                    <DataTable columns={columns} >
                        <tbody className="">
                            {pageData.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`
                                    h-20 border-b border-[#575E72]/10 last:border-none
                                    ${!row.is_active ? "text-gray-400" : ""}
                                    `}
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex justify-between gap-3">
                                        <span className={`${monoFont.className}`}>{row.id}</span>
                                        <span className="text-2xl">{ problemImageMap[row.name] }</span>
                                        </div>

                                    </td>
                                    <td className="px-8 py-4 font-bold">{row.name}{" "}</td>
                                    <td className={`px-6 py-4  ${!row.is_active ? "text-gray-400" : "text-[var(--muted-foreground)]"}`}>{!row.is_active ? "ปิดการใช้งานชั่วคราว - " : ""}{row.description}</td>
                                    <td className="px-6 py-4 ">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-12">
                                                <div className={`${monoFont.className} w-12 h-7 flex items-center justify-center rounded-xl
                                                    ${row.is_active ? "bg-[#FFD100]" : "bg-[#E9E9EA] text-gray-500"}`}>
                                                    {row.total_cases}
                                                </div>

                                                <IOSSwitch
                                                    checked={row.is_active}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;

                                                        setTableData(prev =>
                                                            prev.map(item =>
                                                                item.id === row.id ? { ...item, is_active: checked } : item
                                                            )
                                                        );

                                                        // ถ้ามี filter เปิดอยู่ และ toggle จะทำให้ row หลุด filter
                                                        // → ค้าง row ไว้ 250ms (= duration-200 + เผื่อนิดหน่อย)
                                                        if (statusFilter !== "") {
                                                            setPendingRemoval(prev => new Set(prev).add(row.id));
                                                            setTimeout(() => {
                                                                setPendingRemoval(prev => {
                                                                    const next = new Set(prev);
                                                                    next.delete(row.id);
                                                                    return next;
                                                                });
                                                            }, 400);
                                                        }
                                                    }}


                                                />


                                            </div>

                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--foreground2)]">
                                        <div className="flex items-center justify-between">
                                            <div className={`flex items-center gap-3 ${!row.is_active ? "pointer-events-none opacity-50" : ""} `}>
                                                <EditButton
                                                    onClick={() => {
                                                        setEditingItem({
                                                            id: row.id,
                                                            name: row.name,
                                                            description: row.description,
                                                            emoji: problemImageMap[row.name] || "📝",
                                                        });

                                                        setOpenModal(true);
                                                    }}
                                                />
                                                <DeleteButton />
                                            </div>
                                        </div>
                                    </td>

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

export default ProblemType;
