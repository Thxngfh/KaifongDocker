type Props = {
  status: "รอดำเนินการ" | "กำลังดำเนินการ" | "เสร็จสิ้น" | "พักงาน" | "ถูกปฏิเสธ"
}

export default function StatusBadge({ status }: Props) {
  return (
<span
  className={`px-3 py-2 rounded-sm text-xs font-bold border whitespace-nowrap
    ${status === "รอดำเนินการ" && "bg-yellow-100 text-yellow-700 border-yellow-300/30"}
     ${status === "กำลังดำเนินการ" && "bg-blue-100 text-blue-700 border-blue-300/30"}
     ${status === "เสร็จสิ้น" && "bg-[#F0FDF4] text-green-700 border-[#BBF7D0]"}
      ${status === "พักงาน" && "bg-gray-100 text-gray-700 border-gray-300/30"}
    ${status === "ถูกปฏิเสธ" && "bg-red-100 text-red-700 border-red-300/30"}
    
  `}
>
  {status}
</span>
  )
}