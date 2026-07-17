import { FaCircle } from "react-icons/fa6"

type Props = {
  status: "รอดำเนินการ" | "กำลังดำเนินการ" | "เสร็จสิ้น" | "พักงาน" | "ถูกปฏิเสธ"
}

export default function StatusBadge({ status }: Props) {

  const iconColor = 
    
    status === "รอดำเนินการ"
    ? "#FFD100"
    : status === "กำลังดำเนินการ"
    ?"#3B82F6"
    :status === "เสร็จสิ้น"
    ? "#22C55E"
    :status === "พักงาน"
    ?"#6B7280"
    :status === "ถูกปฏิเสธ"
    ?"#EF4444"
    :"#6B7280"

  return (
<span
  className={`px-3 py-1.5 rounded-full text-sm font-bold border whitespace-nowrap absolute
    ${status === "รอดำเนินการ" && "bg-yellow-100 text-yellow-700 border-yellow-300/30"}
    ${status === "กำลังดำเนินการ" && "bg-blue-100 text-blue-700 border-blue-300/30"}
    ${status === "เสร็จสิ้น" && "bg-green-100 text-green-700 border-[#BBF7D0]"}
    ${status === "พักงาน" && "bg-gray-100 text-gray-700 border-gray-300/30"}
    ${status === "ถูกปฏิเสธ" && "bg-red-100 text-red-700 border-red-300/30"}
  `}
>
    <span className="flex items-center gap-2">
            <FaCircle size={11} color={iconColor}/>
          {status}
    </span>
</span>
  )
}