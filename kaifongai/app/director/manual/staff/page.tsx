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
    title: "คู่มือการลงพื้นที่ตรวจสอบปัญหา",
    description: "แนะนำขั้นตอนการลงพื้นที่ ตรวจสอบหน้างาน และบันทึกข้อมูลให้ครบถ้วนตามมาตรฐาน",
    date: "10 Oct 2023",
    datasize: "2.3 MB",
    filetype: "PDF",
    viewcount: "3,120",
  },
  {
    title: "Infographic ขั้นตอนการปฏิบัติงานภาคสนาม",
    description: "สรุปลำดับขั้นตอนการทำงาน ตั้งแต่รับงานจนถึงรายงานผลแบบเข้าใจง่าย",
    date: "18 Oct 2023",
    datasize: "1920x1080 px",
    filetype: "IMAGE",
    viewcount: "2,050",
  },
  {
    title: "คู่มือการบันทึกผลการดำเนินงาน",
    description: "วิธีกรอกข้อมูลผลการปฏิบัติงาน แนบรูปหลักฐาน และส่งรายงานผ่านระบบ",
    date: "01 Nov 2023",
    datasize: "1.5 MB",
    filetype: "PDF",
    viewcount: "2,740",
  },
  {
    title: "แนวทางการประเมินหน้างานเบื้องต้น",
    description: "วิธีประเมินระดับความรุนแรงของปัญหาและจัดลำดับความสำคัญในการแก้ไข",
    date: "10 Nov 2023",
    datasize: "1.1 MB",
    filetype: "PDF",
    viewcount: "1,980",
  },
  {
    title: "Infographic การถ่ายภาพหลักฐานให้ถูกต้อง",
    description: "ตัวอย่างมุมภาพ การจัดแสง และสิ่งที่ควรถ่ายเพื่อใช้เป็นหลักฐานในการทำงาน",
    date: "15 Nov 2023",
    datasize: "1600x900 px",
    filetype: "IMAGE",
    viewcount: "1,620",
  },
  {
    title: "การใช้งานอุปกรณ์ภาคสนาม",
    description: "แนะนำการใช้อุปกรณ์ เครื่องมือ และข้อควรระวังด้านความปลอดภัยในการปฏิบัติงาน",
    date: "22 Nov 2023",
    datasize: "1.4 MB",
    filetype: "PDF",
    viewcount: "1,310",
  },
  {
    title: "คู่มือความปลอดภัยในการทำงาน",
    description: "ข้อปฏิบัติด้านความปลอดภัย การป้องกันอุบัติเหตุ และการรับมือเหตุฉุกเฉิน",
    date: "18 Dec 2023",
    datasize: "1.2 MB",
    filetype: "PDF",
    viewcount: "1,150",
  },
  {
    title: "Infographic การจัดการปัญหาเร่งด่วน",
    description: "สรุปขั้นตอนการรับมือเหตุเร่งด่วน เช่น ไฟฟ้าขัดข้อง น้ำท่วม หรือถนนชำรุด",
    date: "05 Jan 2024",
    datasize: "2560x1440 px",
    filetype: "IMAGE",
    viewcount: "2,480",
  },
  {
    title: "ช่องทางติดต่อทีมสนับสนุน",
    description: "รวมช่องทางติดต่อหัวหน้างานและทีมช่วยเหลือกรณีต้องการความช่วยเหลือเพิ่มเติม",
    date: "03 Jan 2024",
    datasize: "780 KB",
    filetype: "PDF",
    viewcount: "1,260",
  },
  {
    title: "แนวทางการรายงานปัญหาซ้ำซ้อน",
    description: "วิธีจัดการกรณีพบปัญหาซ้ำในพื้นที่เดิม และการอัปเดตข้อมูลให้ถูกต้องในระบบ",
    date: "08 Feb 2024",
    datasize: "1.6 MB",
    filetype: "PDF",
    viewcount: "1,540",
  },
]


const StaffManualPage = () => {
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

            {/* <button className='bg-accent p-4 rounded-xl font-bold shadow-md cursor-pointer hover:bg-yellow-500 transition flex flex-row'>
                <span>
                    <FaPlus />
                </span>
                <span className=" ml-1 text-black text-md">
                    อัพโหลดคู่มือใหม่
                </span>
            </button> */}

            {/* <div className="flex gap-5 mt-8">
                <EmojiButton/>
                <EmojiButton2/>
            </div> */}

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

export default StaffManualPage