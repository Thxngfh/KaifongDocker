"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; //ใช้รับ category_id จาก URL และใช้ปุ่มกลับ
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

export interface SubProblem {
    id: number;
    subcategory_id: string; 
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

function ProblemTypeDetail() {
    const params = useParams(); // รับ category_id จาก URL /admin/problem-type/[id]
    const router = useRouter(); // ใช้ปุ่มกลับ

    const categoryId = params.id as string; // id นี้คือ category_id จากหน้าใหญ่

    const [summary, setSummary] = useState<ProblemSummary | null>(null);
    const [tableData, setTableData] = useState<SubProblem[]>([]);
    const [currentCategoryName, setCurrentCategoryName] = useState("");
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
        { key: "name", title: "ชื่อประเภทปัญหาย่อย" },
        { key: "description", title: "คำอธิบาย" },
        { key: "count", title: "จำนวนคำร้องเรียน" },
        { key: "manage", title: "จัดการ" },
    ];

    const subProblemInfoMap: Record<
        string,
        {
            emoji: string;
            description: string;
        }
    > = {
        "ถนนและทางเท้า": {
            emoji: "🛣️",
            description: "ปัญหาเกี่ยวกับถนน ทางเท้า ผิวจราจร หลุมบ่อ และทางเดินสาธารณะ",
        },

        "ไฟฟ้าสาธารณะ": {
            emoji: "💡",
            description: "ปัญหาเกี่ยวกับไฟส่องสว่างสาธารณะ ไฟดับ ไฟกระพริบ หรืออุปกรณ์ไฟฟ้าชำรุด",
        },

        "ระบบระบายน้ำ": {
            emoji: "🕳️",
            description: "ปัญหาเกี่ยวกับท่อระบายน้ำอุดตัน น้ำท่วมขัง และระบบระบายน้ำ",
        },

        "อาคารและสิ่งก่อสร้าง": {
            emoji: "🏗️",
            description: "ปัญหาเกี่ยวกับอาคาร สิ่งก่อสร้าง หรือโครงสร้างที่ชำรุดและไม่ปลอดภัย",
        },

        "การจัดการขยะ": {
            emoji: "🗑️",
            description: "ปัญหาเกี่ยวกับการเก็บขยะ ขยะตกค้าง ขยะล้น หรือการจัดการขยะ",
        },

        "พื้นที่สีเขียว": {
            emoji: "🌳",
            description: "ปัญหาเกี่ยวกับสวนสาธารณะ ต้นไม้ พื้นที่สีเขียว หรือภูมิทัศน์",
        },

        "ความสะอาดทั่วไป": {
            emoji: "🧹",
            description: "ปัญหาเกี่ยวกับความสะอาดในพื้นที่สาธารณะ ถนน ทางเท้า หรือชุมชน",
        },

        "สัตว์รบกวน": {
            emoji: "🐕",
            description:
                "ปัญหาเกี่ยวกับสัตว์รบกวน สัตว์จรจัด หรือผลกระทบต่อความปลอดภัยและสุขอนามัยของประชาชน",
            },

        "เหตุรำคาญทางเสียง": {
            emoji: "🔊",
            description: "ปัญหาเกี่ยวกับเสียงดังรบกวน เสียงจากงานก่อสร้าง หรือกิจกรรมในชุมชน",
        },

        "มลพิษทางอากาศและน้ำ": {
            emoji: "🏭",
            description: "ปัญหาเกี่ยวกับควัน กลิ่น ฝุ่น น้ำเสีย หรือมลพิษในพื้นที่",
        },

        "การควบคุมโรค": {
            emoji: "🦠",
            description: "ปัญหาเกี่ยวกับโรคติดต่อ แหล่งเพาะเชื้อ หรือการควบคุมโรคในชุมชน",
        },

        "อาหารและตลาด": {
            emoji: "🍽️",
            description: "ปัญหาเกี่ยวกับสุขลักษณะอาหาร ตลาด ร้านค้า หรือแหล่งจำหน่ายอาหาร",
        },

        "การจราจรและท้องถนน": {
            emoji: "🚦",
            description: "ปัญหาเกี่ยวกับการจราจร การจอดรถ การกีดขวางทาง หรือความปลอดภัยบนถนน",
        },

        "หาบเร่แผงลอย": {
            emoji: "🛒",
            description: "ปัญหาเกี่ยวกับหาบเร่ แผงลอย การตั้งร้านกีดขวาง หรือการใช้พื้นที่สาธารณะ",
        },

        "สัตว์จรจัด": {
            emoji: "🐾",
            description: "ปัญหาเกี่ยวกับสัตว์จรจัด สัตว์รบกวน หรือความปลอดภัยของประชาชน",
        },

        "ป้ายผิดกฎหมาย": {
            emoji: "🚧",
            description: "ปัญหาเกี่ยวกับป้ายผิดกฎหมาย ป้ายชำรุด หรือป้ายกีดขวางทางสาธารณะ",
        },

        "เบี้ยยังชีพและสวัสดิการ": {
            emoji: "🤝",
            description: "ปัญหาเกี่ยวกับเบี้ยยังชีพ สวัสดิการประชาชน หรือสิทธิช่วยเหลือ",
        },

        "ศูนย์พัฒนาเด็กเล็ก": {
            emoji: "🧒",
            description: "ปัญหาเกี่ยวกับศูนย์เด็กเล็ก การดูแลเด็ก หรือบริการด้านเด็ก",
        },

        "กิจกรรมชุมชน": {
            emoji: "🏘️",
            description: "ปัญหาเกี่ยวกับกิจกรรมชุมชน การมีส่วนร่วม หรือการพัฒนาชุมชน",
        },

        "อาชีพและรายได้": {
            emoji: "💼",
            description: "ปัญหาเกี่ยวกับการส่งเสริมอาชีพ รายได้ หรือการช่วยเหลือด้านเศรษฐกิจ",
        },

        "พฤติกรรมการบริการ": {
            emoji: "🏢",
            description: "ปัญหาเกี่ยวกับการให้บริการของหน่วยงานภาครัฐและเจ้าหน้าที่",
        },

        "ระบบดิจิทัลและการติดต่อ": {
            emoji: "💻",
            description: "ปัญหาเกี่ยวกับระบบออนไลน์ บริการดิจิทัล หรือการใช้งานผ่านเว็บไซต์",
        },

        "ความโปร่งใส": {
            emoji: "📋",
            description: "ปัญหาเกี่ยวกับความโปร่งใส การตรวจสอบ หรือธรรมาภิบาล",
        },

        "ข้อเสนอแนะทั่วไป": {
            emoji: "💬",
            description: "ข้อเสนอแนะหรือความคิดเห็นทั่วไปเพื่อปรับปรุงการให้บริการ",
        },
    };

        useEffect(() => {
        if (!categoryId) return;

        fetch(`/api/problem-type/${categoryId}`)
            .then((res) => {
            if (!res.ok) {
                throw new Error(
                "ไม่สามารถโหลดข้อมูลประเภทปัญหาย่อยได้"
                );
            }

            return res.json();
            })
            .then((json) => {
            const mappedData: SubProblem[] = (
                json.data ?? []
            ).map((item: SubProblem) => ({
                ...item,
                description:
                subProblemInfoMap[item.name]
                    ?.description ||
                item.description ||
                "",
            }));

            setCurrentCategoryName(
                json.category?.name ?? ""
            );

            setTableData(mappedData);

            setSummary({
                total: mappedData.length,
                active: mappedData.filter(
                (item) => item.is_active
                ).length,
                inactive: mappedData.filter(
                (item) => !item.is_active
                ).length,
            });
            })
            .catch((error) => {
            console.error(
                "Fetch subcategory error:",
                error
            );

            setCurrentCategoryName("");
            setTableData([]);

            setSummary({
                total: 0,
                active: 0,
                inactive: 0,
            });
            });
        }, [categoryId]);

    return (
        <div className={`${thaiFont.className} h-screen bg-background`}>
            <div className="w-full px-8 py-8 mx-auto">

                <button
                    onClick={() => router.back()}
                    className="mb-6 ml-10 inline-flex items-center gap-2 text-xl font-bold text-gray-700 hover:text-black"
                >
                    ← กลับ
                </button>

                <h1 className="text-3xl font-bold text-[#24304A]">จัดการประเภทปัญหาย่อยของ{currentCategoryName}</h1>
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
                                    key={row.subcategory_id}
                                    className={`
                                    h-20 border-b border-[#575E72]/10 last:border-none
                                    ${!row.is_active ? "text-gray-400" : ""}
                                    `}
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex justify-between gap-3">
                                        <span className={`${monoFont.className}`}>{row.id}</span>

                                        </div>

                                    </td>

                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* ใช้ emoji จาก subProblemInfoMap ตามชื่อประเภทปัญหาย่อย */}
                                            <span className="text-2xl">
                                                {subProblemInfoMap[row.name]?.emoji}
                                            </span>

                                            <span>{row.name}</span>
                                        </div>
                                    </td>

                                    <td className={`px-6 py-4  ${!row.is_active ? "text-gray-400" : "text-[var(--muted-foreground)]"}`}>
                                        {!row.is_active ? "ปิดการใช้งานชั่วคราว - " : ""}
                                        {row.description}
                                    </td>

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
                                                            emoji: subProblemInfoMap[row.name]?.emoji || "📝",
                                                        });

                                                        setOpenModal(true);
                                                    }}
                                                />

                                                <DeleteButton
                                                    onDelete={() => {
                                                        // ยืนยันก่อนลบ ไม่ให้กดแล้วลบเลย
                                                        if (window.confirm("ยืนยันการลบประเภทปัญหาย่อยนี้?")) {
                                                            console.log("delete subcategory:", row.subcategory_id);
                                                        }
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

export default ProblemTypeDetail;