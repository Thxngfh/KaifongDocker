type Props = {
  status: "กำลังดำเนินการ" | "ประเมินผลเสร็จสิ้น" | "ไม่รับเรื่อง"
}

export default function StatusBadge({ status }: Props) {
  return (
<span
  className={`px-3 py-2 rounded-sm text-xs font-bold border whitespace-nowrap
    ${status === "ประเมินผลเสร็จสิ้น" && "bg-[#F0FDF4] text-green-700 border-[#BBF7D0]"}
    ${status === "กำลังดำเนินการ" && "bg-[#FFD100]/20 text-yellow-800 border-[#FFD100]/30"}
    ${status === "ไม่รับเรื่อง" && "bg-red-100 text-red-700 border-red-300/30"}
  `}
>
  {status}
</span>
  )
}