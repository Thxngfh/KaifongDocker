//สำหรับcardที่มีส่วนคล้าบกัย การ์ดส่วนที่2ของหน้า dashboard
import type { ComponentType, SVGProps } from 'react'
interface SummaryCardProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>> | string;
  title: string;
  value: number | string;
  subvalue?: string | number;
  color: string;
  className?: string;
  styleIcon?: string;
  iconColor?: string;

}
//

export default function SummaryCard2({ icon: Icon, title, value, subvalue, color, className, styleIcon, iconColor }: SummaryCardProps) {
  return (
    <div
      className={className || "w-full min-w-0 bg-white rounded-xl shadow-xs flex gap-5 p-6 min-h-32 items-center overflow-hidden"}
    >

      {/*bg+icon*/}
      <div className={`size-14 ${styleIcon || "rounded-full"} bg-muted flex items-center justify-center shrink-0 `} style={{ backgroundColor: color }}>
        {Icon && typeof Icon !== "string" && (
          <Icon
            className="w-6 h-6 text-[#5D6478] stroke-[1.75]"
            style={{ color: iconColor }}
          />
        )}
        {Icon && typeof Icon === "string" && (
          <img
            src={Icon}
            alt="icon"
            className="w-6 h-6"
          />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        {/* title */}
        <p className="text-sm text-[#575E72] truncate">{title}</p>

        {/* value row */}
        <div className="flex items-end gap-x-2">
          <span className="text-3xl font-bold text-[#161B29]">
              {typeof value === "number" ? value === 0 ? value : String(value).padStart(2, "0") : value}
          </span>

          {/* sub */}
          {subvalue && (
            <span className="text-xs text-gray-400 my-1">
              {subvalue}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}