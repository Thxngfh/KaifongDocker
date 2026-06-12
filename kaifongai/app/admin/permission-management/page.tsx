"use client";
import { useEffect, useState, useMemo } from "react";
import SummaryCard2 from "../../../components/ui/Admin_director/SummaryCard2";
import DataTable from "@/components/ui/Admin_director/DataTableBase"
import { Member } from "@/services/memberData"
import ComplaintPagination from "@/components/ui/Admin_director/PageNavigation";
import FilterButton from "@/components/ui/Admin_director/FilterButton"
import IOSSwitch from "@/components/ui/Admin_director/Toggle";
import EditButton from "@/components/ui/Admin_director/EditButton"
import { Sarabun } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";
import FilterModal from "@/components/ui/Admin_director/FilterModal";
import EditMemberModal from "@/components/ui/Admin_director/EditMemberModal";


const monoFont = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
})

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

export interface MemberSummary {
    admin: number;
    staff: number;
    auditor: number;
    inactive: number;
}

function PermissionManagement() {
    const [summary, setSummary] = useState<MemberSummary | null>(null);
    const [tableData, setTableData] = useState<Member[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 5;

    //filter checkbox 
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            const roleMatch =
                selectedRoles.length === 0 || selectedRoles.includes(item.role);

            const typeMatch =
                selectedTypes.length === 0 ||
                selectedTypes.includes(item.technician_type);

            return roleMatch && typeMatch;
        });
    }, [tableData, selectedRoles, selectedTypes]);

    const pageData = useMemo(() => {
        return filteredData.slice(
            (currentPage - 1) * limit,
            currentPage * limit
        );
    }, [filteredData, currentPage]);

    const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / limit);
    }, [filteredData]);
   
    const types = Array.from(
    new Set(tableData
        .filter((m) => m.technician_type !== "-")
        .map(m => m.technician_type))
    );

    const roles = Array.from(
    new Set(tableData.map((m) => m.role))
    );
    //----จบ filter เชิญแกะ เชิญก๊อป---//
    //ขอบคุณครับสำหรับfilterแซ่บๆ

    //edit
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsEditOpen(true);
    };


    //หัวตาราง 
    const columns = [
        { key: "row", title: "บทบาท" },
        { key: "name", title: "ชื่อ-นามสกุล" },
        { key: "email", title: "อีเมลล์" },
        { key: "department", title: "หน่วยงาน" },
        { key: "type", title: "ประเภทช่าง" },
    ];

    const topCards =
        summary
            ? [
                {
                    title: "แอดมินระบบ",
                    value: summary.admin,
                    iconColor: "#725C00", // สี icon
                    color: "rgba(255, 209, 0, 0.2)",     // สีพื้นหลังการ์ด hex
                    icon: "/member-management/admin.svg",
                },
                {
                    title: "เจ้าหน้าที่",
                    value: summary.staff,
                    iconColor: "#1D4ED8",
                    color: "#DBEAFE",
                    icon: "/member-management/staff.svg",
                },
                {
                    title: "ผู้ตรวจสอบ",
                    value: summary.auditor,
                    iconColor: "#047857",
                    color: "#D1FAE5",
                    icon: "/member-management/auditor.svg",
                },
                {
                    title: "ระงับสิทธิ์",
                    value: summary.inactive,
                    iconColor: "#BA1A1A",
                    color: "#FFDAD6",
                    icon: "/member-management/inactive.svg",
                },
            ]
            : [];

    useEffect(() => {
        fetch("/api/permission-management/table")
            .then((res) => res.json())
            .then((members: Member[]) => {
                const formatted = members.map((m) => ({
                    ...m
                }));
                setTableData(formatted);
            })
            .catch((err) => console.error("Fetch error:", err));
    }, []);

    useEffect(() => {
        fetch("/api/permission-management/summary")
            .then(res => res.json())
            .then(data => {
                setSummary(data);
                console.log("Data parsed:", data);
            })
            .catch(err => console.error("Fetch error:", err));
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRoles, selectedTypes]);



    return (
        <div className={`${thaiFont.className} h-screen bg-background`}>
            <div className="w-full px-8 py-8 mx-auto">

                <div className="w-full flex justify-between mr-24">
                    <h1 className="text-3xl font-bold text-[#333847] mb-3 pl-10">จัดการสิทธิ์{" "}{tableData.length}</h1>
                    <div className="ml-6">
                        <FilterButton onClick={() => setIsFilterOpen(true)} />
                        {/* filter checkbox*/}
                        <FilterModal
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            roles={roles}
                            types={types}
                            selectedRoles={selectedRoles}
                            selectedTypes={selectedTypes}
                            setSelectedRoles={setSelectedRoles}
                            setSelectedTypes={setSelectedTypes}
                        />
                    </div>
                </div>

                <p className="text-xl text-muted-foreground mb-12 mx-10 ">จัดการบทบาทและสถานะการเข้าใช้งานระบบของบุคลากร Kaifong AI</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-6 ml-10 mt-10">
                    {topCards.map((item, index) => (
                        <SummaryCard2
                            key={index}
                            icon={item.icon}
                            title={item.title}
                            value={item.value}
                            iconColor={item.iconColor}
                            color={item.color}
                            className="bg-white rounded-xl flex gap-x-5 p-6 border border-[#D1C6AB]/10"
                            styleIcon="rounded-lg"
                        />
                    ))}
                </div>

                {/* table */}
                <div className="overflow-x-auto mt-10 ml-6">
                    <DataTable columns={columns}>
                        <tbody className="">
                            {pageData.map((row) => (
                                <tr key={row.id} className="h-20">
                                    <td className="px-6 py-4">
                                        <span
                                            className={`
                                                w-26 text-center px-4 py-2 rounded-full font-bold text-sm font-medium inline-block
                                                ${row.role === "แอดมิน"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : row.role === "เจ้าหน้าที่"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : row.role === "ผู้ตรวจสอบ"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-500"
                                                }
                                        `}
                                        >
                                            {row.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 font-bold">{row.name}{" "}{row.lastname}</td>
                                    <td className={`${monoFont.className} px-6 py-4 text-[var(--muted-foreground)]`}>{row.email}</td>
                                    <td className="px-6 py-4 text-[var(--foreground2)]">{row.department}</td>
                                    <td className="px-6 py-4 ">
                                        <div className="flex items-center justify-between">


                                            <div className="text-[var(--foreground2)] flex-1">
                                                {row.technician_type}
                                            </div>


                                            <div className="flex items-center gap-8">
                                                <IOSSwitch
                                                    checked={row.is_active}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;

                                                        setTableData(prev =>
                                                            prev.map(item =>
                                                                item.id === row.id
                                                                    ? { ...item, is_active: checked }
                                                                    : item
                                                            )
                                                        );
                                                    }}
                                                />
                                                <EditButton onClick={() => handleEdit(row)}  />
                                                    <EditMemberModal
                                                    isOpen={isEditOpen}
                                                    member={editingMember}
                                                    onClose={() => setIsEditOpen(false)}
                                                    onSave={(data) => {
                                                        console.log("save", data);
                                                    }}
                                                    />
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

export default PermissionManagement;

//ควรมี alert ตอนเปลี่ยนสถานะเพื่อ ระงับสิทธิ์ไหมนะ 