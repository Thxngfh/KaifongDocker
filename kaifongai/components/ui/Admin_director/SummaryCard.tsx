//สำหรับcardที่มีส่วนคล้าบกัย การ์ดส่วนที่1ของหน้า dashboard
interface SummaryCardProps {
  title: string;
  value: number | string;
  subvalue?: string | number ;
  color?: string;
}

export default function SummaryCard({ title, value, subvalue, color }: SummaryCardProps) {
  return (
    <div
      className="bg-white rounded-lg border-l-4 p-3 sm:p-4 lg:p-5 border-[#D9D9D9] shadow-xs space-y-1 sm:space-y-2 h-24 sm:h-26 lg:h-28"
      style={{ borderColor: color }}
    >
      {/* title */}
      <p className="text-md text-[#575E72] mb-1 truncate">{title}</p>

      {/* value row */}
      <div className="flex items-end  gap-2 sm:gap-4 lg:gap-x-16 xl:gap-x-4">
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
          {typeof value === "number"
            ? value === 0
              ? value
              : String(value).padStart(2, "0")
            : value}
        </span>

        {/* sub */}
        {subvalue && (
          <span className="text-[10px] sm:text-xs text-gray-400 my-1 ">
            {subvalue}
          </span>
        )}
      </div>
    </div>
  );
}
