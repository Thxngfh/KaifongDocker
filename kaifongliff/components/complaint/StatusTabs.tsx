// แท็บกรองสถานะในหน้า track-complaint
export type TabKey =
  | "all"
  | "in_progress"
  | "resolved"
  | "pending"
  | "paused"
  | "rejected";

interface StatusTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  counts: {
    all: number;
    in_progress: number;
    resolved: number;
    pending: number;
    paused: number;
    rejected: number;
  };
}

// ลำดับและชื่อแท็บที่แสดง
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",         label: "ทั้งหมด" },
  { key: "pending",     label: "รอดำเนินการ" },
  { key: "in_progress", label: "กำลังดำเนินการ" },
  { key: "resolved",    label: "เสร็จสิ้น" },
  { key: "paused",      label: "พักงาน" },
  { key: "rejected",    label: "ถูกปฎิเสธ" },
];

export function StatusTabs({ active, onChange, counts }: StatusTabsProps) {
  return (
   
    <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
        {TABS.map((tab) => {
          const isActive = tab.key === active;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-foreground text-xs text-background"
                  : "bg-[#EABB01] text-xs text-foreground hover:bg-[#f3cd45] hover:shadow-md"
              }`}
            >
              <span>{tab.label}</span>
              {/* จำนวนคำร้องในแต่ละสถานะ */}
              <span
                className={`rounded-full px-1 py-0.5 text-xs font-semibold ${
                  isActive ? "text-brand" : ""
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}