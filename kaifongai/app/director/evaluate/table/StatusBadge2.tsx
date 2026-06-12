import { FaCircle } from "react-icons/fa6"

type Props = {
  status: "กำลังดำเนินการ" | "ประเมินผลเสร็จสิ้น" | "ไม่รับเรื่อง"
}

export default function StatusBadge({ status }: Props) {

  const iconColor = status === "ประเมินผลเสร็จสิ้น"
    ? "#22C55E"
    : status === "กำลังดำเนินการ"
    ? "#FFD100"
    : "#EF4444"

  return (
<span
  className={`px-3 py-1.5 rounded-full text-sm font-bold border whitespace-nowrap absolute
    ${status === "ประเมินผลเสร็จสิ้น" && "bg-green-100 text-green-700 border-[#BBF7D0]"}
    ${status === "กำลังดำเนินการ" && "bg-yellow-100 text-yellow-800 border-[#FFD100]/30"}
    ${status === "ไม่รับเรื่อง" && "bg-red-100 text-red-700 border-red-300/30"}
  `}
>
    <span className="flex items-center gap-2">
            <FaCircle size={11} color={iconColor}/>
          {status}
    </span>
</span>
  )
}