//สำหรับหน้า ที่มี การ์ดจัดอันดับ เช่น dashboard
import type { ComponentType, SVGProps } from 'react'
interface SummaryCardProps {
  key: number ;
  rank: number;
  icon: ComponentType<SVGProps<SVGSVGElement>> | string;
  title: string;
  value: string | number;
  subvalue: string | number;

}

export default function RankingCard({ rank, icon : Icon, title, value, subvalue }: SummaryCardProps) {
  return (
    <div className="dashboard-ranking w-full rounded-xl border border-[#D1C6AB]/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium bg-[#FFD100]/20 text-[#6F5A00] px-3 py-1 rounded-full">
          อันดับ {rank}
        </span>
        
        {typeof Icon === "string" ? ( //เผื่อใช้ รูป svg
        <img src={Icon} alt={title} className="w-6 h-6" />
        ) : Icon ? (
          <Icon className="w-6 h-6 text-[#CBD5E1] stroke-[1.75]" />
        ) : null}

      </div>
      <h3 className="font-bold text-[var(--primary)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">{value}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground2 mb-1">
        <span className=" text-[var(--rank-foreground2)]">ความคืบหน้า</span>
        <span className=" text-[var(--rank-foreground2)]">{subvalue}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-[var(--rank-foreground2)] rounded-full transition-all`}
          style={{ width: `${subvalue}%` }}
        />
      </div>
      </div>

      );
}