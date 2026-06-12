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
//view countไม่มีแล้ว แต่ให้ไปแก้ที่ฐานข้อมูลไม่ใช่codeนะจ๊ะ >3< เวลาจะส่งต่อให้คนอื่นค่อยมาclean codeอีกที
const data: FileItem[] = [
  {
    title: "คู่มือการแจ้งปัญหาผ่านระบบ",
    description: "แนะนำวิธีส่งคำร้อง แนบรูปภาพ ติดตามสถานะ และตรวจสอบประวัติการแจ้งปัญหา",
    date: "12 Oct 2023",
    datasize: "2.1 MB",
    filetype: "PDF",
    viewcount: "3,240",
  },
  {
    title: "Infographic ขั้นตอนการแจ้งเรื่องร้องเรียน",
    description: "สรุปขั้นตอนการแจ้งเรื่องร้องเรียนแบบเข้าใจง่ายในภาพเดียว",
    date: "18 Oct 2023",
    datasize: "1920x1080 px",
    filetype: "IMAGE",
    viewcount: "2,110",
  },
  {
    title: "คำถามที่พบบ่อย (FAQ)",
    description: "รวมคำถามยอดนิยมเกี่ยวกับการสมัครสมาชิก การใช้งานระบบ และการติดต่อเจ้าหน้าที่",
    date: "01 Nov 2023",
    datasize: "1.3 MB",
    filetype: "PDF",
    viewcount: "2,980",
  },
  {
    title: "ขั้นตอนการรีเซ็ตรหัสผ่าน",
    description: "วิธีเปลี่ยนรหัสผ่าน กู้คืนบัญชี และตั้งค่าความปลอดภัยเบื้องต้น",
    date: "10 Nov 2023",
    datasize: "980 KB",
    filetype: "PDF",
    viewcount: "1,870",
  },
  {
    title: "Infographic วิธีติดตามสถานะคำร้อง",
    description: "แสดงวิธีตรวจสอบสถานะคำร้องและความคืบหน้าแบบรวบรัด",
    date: "15 Nov 2023",
    datasize: "1600x900 px",
    filetype: "IMAGE",
    viewcount: "1,540",
  },
  {
    title: "การแนบรูปภาพและไฟล์หลักฐาน",
    description: "แนะนำขนาดไฟล์ที่รองรับ วิธีอัปโหลด และข้อควรระวังในการแนบเอกสาร",
    date: "22 Nov 2023",
    datasize: "1.1 MB",
    filetype: "PDF",
    viewcount: "1,220",
  },
  {
    title: "คู่มือการแก้ไขข้อมูลส่วนตัว",
    description: "วิธีแก้ไขชื่อ เบอร์โทร อีเมล และตั้งค่าการแจ้งเตือนส่วนบุคคล",
    date: "18 Dec 2023",
    datasize: "1.0 MB",
    filetype: "PDF",
    viewcount: "980",
  },
  {
    title: "Infographic ฟีเจอร์ใหม่ในระบบ",
    description: "แนะนำฟีเจอร์ใหม่ เช่น แจ้งเตือนอัตโนมัติ และติดตามงานแบบเรียลไทม์",
    date: "05 Jan 2024",
    datasize: "2560x1440 px",
    filetype: "IMAGE",
    viewcount: "2,760",
  },
  {
    title: "ช่องทางติดต่อเจ้าหน้าที่",
    description: "รวมช่องทางการติดต่อ เวลาให้บริการ และขั้นตอนการขอความช่วยเหลือ",
    date: "03 Jan 2024",
    datasize: "750 KB",
    filetype: "PDF",
    viewcount: "1,540",
  },
  {
    title: "แนวทางการเขียนคำร้องให้ครบถ้วน",
    description: "ตัวอย่างการกรอกข้อมูลเพื่อให้เจ้าหน้าที่ตรวจสอบและดำเนินการได้รวดเร็วขึ้น",
    date: "08 Feb 2024",
    datasize: "1.6 MB",
    filetype: "PDF",
    viewcount: "1,760",
  },
]


const UserManualPage = () => {
    const [currentPage, setCurrentPage] = React.useState(1)
    const [activeTab, setActiveTab] = React.useState<"all" | "pending">("all")
    const [search, setSearch] = React.useState("")
    const pageSize = 3

    const filteredData = React.useMemo(() => {
        return data.filter((item) => {
        const keyword = search.toLowerCase();

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
        return data.slice(startIndex, startIndex + pageSize)
      }, [data, currentPage])

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

export default UserManualPage
