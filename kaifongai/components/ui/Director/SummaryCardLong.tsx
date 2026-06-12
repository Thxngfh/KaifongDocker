interface SummaryCardProps {
  title_app: string
  title_number: string
  title_department: string
  title_status: string
  title_comment: string
  title_time: string
  value_app: string
  value_number: string
  value_department: string
  value_status: string
  value_comment: string
  value_time: string
}

function InfoBlock({
  label,
  value,
  valueClassName = "",
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-[120px]">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className={`mt-1 text-[18px] font-bold text-[#161B29] ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}

type Props = {
  status: "กำลังดำเนินการ" | "ประเมินผลเสร็จสิ้น" | "ไม่รับเรื่อง"
}

export default function SummaryCardLong({
  title_app,
  title_number,
  title_department,
  title_status,
  title_comment,
  title_time,
  value_app,
  value_number,
  value_department,
  value_status,
  value_comment,
  value_time,
}: SummaryCardProps) {
  return (
    <div className="relative w-full rounded-2xl bg-white px-8 py-12 shadow-sm">
      {/* แถบเหลืองด้านซ้าย */}
      <div className="absolute left-0 top-0 bottom-0 rotate-180 w-2 rounded-r-full bg-[#FFD100]" />

      <div className='flex flex-wrap items-start gap-x-14 gap-y-6 pl-4 justify-between font-bold'>
        <InfoBlock label={title_app} value={`ผ่านทาง${value_app}`} />
        <InfoBlock label={title_number} value={value_number} />
        <InfoBlock label={title_department} value={value_department} />
        <InfoBlock
          label={title_status}
          value={value_status}
          valueClassName={`
            ${value_status === "ประเมินผลเสร็จสิ้น" && "text-[#059669]"}
            ${value_status === "กำลังดำเนินการ" && "text-yellow-600"}
            ${value_status === "ไม่รับเรื่อง" && "text-red-600"}
            `}
        />
        <InfoBlock label={title_comment} value={value_comment} valueClassName="font-medium"/>
        <InfoBlock label={title_time} value={value_time} />
      </div>
    </div>
  )
}