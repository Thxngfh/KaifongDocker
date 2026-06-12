"use client"
import React from 'react'
import EmojiButton from '@/components/ui/Director/EmojiButton'
import EmojiButton2 from '@/components/ui/Director/EmojiButton2'
import ComplaintSearchInput from '@/components/ui/Admin_director/ComplainSearchInput'
import { RiDropdownList } from 'react-icons/ri'
import ManualToolbar from '@/components/ui/Director/ManualToolbar'
import ComplaintPagination from '@/components/ui/Admin_director/PageNavigation'
import FileCard from '@/components/ui/Director/fileCard'
import { FaPlus } from 'react-icons/fa6'
import { Sarabun} from "next/font/google";

const thaiFont = Sarabun({
    subsets: ["thai"],
    weight: ["400", "500", "700"],
});

type FileItem = {
    title: string
    description: string
    date: string
    datasize: string
    filetype?: string
    viewcount: string
    image?: string
}

const data: FileItem[] = [
    {
    title: "คู่มือการรับคำร้องสำหรับเจ้าหน้าที่",
    description: "อธิบายขั้นตอนการรับเรื่อง ตรวจสอบข้อมูลเบื้องต้น และบันทึกคำร้องเข้าสู่ระบบอย่างถูกต้อง",
    date: "10 Oct 2023",
    datasize: "2.4 MB",
    filetype: "PDF",
    viewcount: "3,520",
  },
  {
    title: "Infographic ขั้นตอนการตรวจสอบคำร้อง",
    description: "สรุปลำดับการตรวจสอบคำร้อง ตั้งแต่รับเรื่องจนถึงส่งต่อหน่วยงานที่เกี่ยวข้อง",
    date: "18 Oct 2023",
    datasize: "1920x1080 px",
    filetype: "IMAGE",
    viewcount: "2,430",
  },
  {
    title: "คู่มือการมอบหมายงานให้เจ้าหน้าที่ภาคสนาม",
    description: "แนะนำวิธีเลือกผู้รับผิดชอบ แจ้งเตือนงาน และติดตามความคืบหน้าของภารกิจ",
    date: "02 Nov 2023",
    datasize: "1.8 MB",
    filetype: "PDF",
    viewcount: "2,980",
  },
  {
    title: "ขั้นตอนการอัปเดตสถานะคำร้อง",
    description: "อธิบายการเปลี่ยนสถานะ เช่น กำลังดำเนินการ เสร็จสิ้น หรือไม่รับเรื่อง พร้อมเงื่อนไขการใช้งาน",
    date: "12 Nov 2023",
    datasize: "1.1 MB",
    filetype: "PDF",
    viewcount: "2,110",
  },
  {
    title: "Infographic การส่งต่อหน่วยงานที่เกี่ยวข้อง",
    description: "แสดงขั้นตอนการประสานงานและส่งต่อคำร้องไปยังหน่วยงานภายในอย่างรวบรัด",
    date: "20 Nov 2023",
    datasize: "1600x900 px",
    filetype: "IMAGE",
    viewcount: "1,760",
  },
  {
    title: "การแนบเอกสารประกอบการพิจารณา",
    description: "วิธีอัปโหลดไฟล์หลักฐาน รูปภาพ เอกสารเพิ่มเติม และข้อควรระวังในการจัดเก็บข้อมูล",
    date: "28 Nov 2023",
    datasize: "1.5 MB",
    filetype: "PDF",
    viewcount: "1,490",
  },
  {
    title: "คู่มือการใช้งานแดชบอร์ดเจ้าหน้าที่",
    description: "อธิบายการดูสถิติคำร้อง รายงานประจำวัน และข้อมูลสรุปเพื่อการตัดสินใจ",
    date: "15 Dec 2023",
    datasize: "2.0 MB",
    filetype: "PDF",
    viewcount: "2,640",
  },
  {
    title: "Infographic KPI การดำเนินงานประจำเดือน",
    description: "สรุปตัวชี้วัดสำคัญ เช่น เวลาปิดงาน จำนวนคำร้อง และประสิทธิภาพการทำงาน",
    date: "05 Jan 2024",
    datasize: "2560x1440 px",
    filetype: "IMAGE",
    viewcount: "2,920",
  },
  {
    title: "ช่องทางติดต่อผู้ดูแลระบบ",
    description: "รวมข้อมูลติดต่อทีมสนับสนุนระบบ เวลาให้บริการ และขั้นตอนแจ้งปัญหาการใช้งาน",
    date: "12 Jan 2024",
    datasize: "820 KB",
    filetype: "PDF",
    viewcount: "1,340",
  },
  {
    title: "แนวทางการตอบกลับผู้ร้องเรียนอย่างมืออาชีพ",
    description: "ตัวอย่างการสื่อสารกับประชาชน การแจ้งผลดำเนินการ และการตอบกลับอย่างสุภาพชัดเจน",
    date: "08 Feb 2024",
    datasize: "1.7 MB",
    filetype: "PDF",
    viewcount: "1,980",
  },
]


const ReporterManualPage = () => {
    const [currentPage, setCurrentPage] = React.useState(1)
    const [activeTab, setActiveTab] = React.useState<"all" | "pending">("all")
    const [search, setSearch] = React.useState("")
    const pageSize = 3

    const filteredData = React.useMemo(() => {
        const keyword = search.toLowerCase().trim();
        
        if (!keyword) return data;
        
        return data.filter((item) => {
            return (
                item.title.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.filetype?.toLowerCase().includes(keyword)
            );
        });
    }, [search]);

    const totalPages = Math.ceil(data.length / pageSize)

    const paginatedData = React.useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
            return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, currentPage])

    React.useEffect(() => {
            setCurrentPage(1)
    }, [activeTab, search])

  return (
    <div className={`${thaiFont.className} min-h-screen bg-background flex  justify-center`}>
        <div className="max-w-7xl mx-3 px-6 sm:px-6 lg:px-8 py-8 w-full mt-5">
            <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold text-secondary mb-7">คู่มือการใช้งาน</h1>
                <p className="text-lg text-muted-foreground -mt-4">
                เอกสารสำหรับผู้ใช้งานระบบ KaiFongAI
                </p>
            </div>

            <button className="bg-accent px-4 py-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-yellow-500 transition flex items-center gap-2">
                <FaPlus />
                <span className="text-black text-md">อัพโหลดคู่มือใหม่</span>
            </button>
        </div>

            {/* <div className="flex gap-5 mt-8">
                {/* อันนี้เดี๋ยวเปลี่ยนทีหลังให้มันตามลิงค์ไม่ใช่staticแบบนี้ (มีcomponentsอยู่แล้ว) */}
                {/* <button className='bg-white p-4 rounded-xl font-bold shadow-xs cursor-pointer hover:bg-gray-200 transition border-1 border-gray-200'>
                    <span className='ml-1 text-[#575E72]'>
                        🧑‍💼 คู่มือการใช้งานเจ้าหน้าที่
                    </span>
                    <span className="bg-[#DEE2F5] text-[#575E72] text-xs rounded-xl ml-4 mr-1 px-2.5 py-1.5">
                        12
                    </span>
                </button>
                <button className='bg-accent p-4 rounded-xl font-bold shadow-md cursor-pointer hover:bg-yellow-500 transition'>
                    <span className='ml-1 text-black'>
                        📣 คู่มือการใช้งานผู้แจ้งเรื่อง
                    </span>
                    <span className="bg-black text-accent text-xs rounded-xl ml-4 mr-1 px-2 py-1">
                        05
                    </span>
                </button> */}
            {/* </div>  */}

            <div className='mt-8'>
                <ManualToolbar
                    search={search}
                    setSearch={setSearch}
                />
            </div>

            <div className='flex flex-row gap-10 mt-10'>
                {paginatedData.map((item, index) => (
                    <FileCard key={index} item={item} />
                ))}
            </div>

            <div className='mb-10 mt-40'>
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

export default ReporterManualPage
