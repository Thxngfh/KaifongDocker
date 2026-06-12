type ComplaintStatusTabsProps = {
  activeTab: "all" | "pending"
  onChangeTab?: (tab: "all" | "pending") => void
}

export default function ComplaintStatusTabs({
  activeTab,
  onChangeTab,
}: ComplaintStatusTabsProps) {
  return (
    <div className="flex items-center gap-4 shrink-0">
      <button
        type="button"
        onClick={() => onChangeTab?.("all")}
        className={`px-12 py-2.5 rounded-full font-medium whitespace-nowrap transition duration-250 cursor-pointer ${
          activeTab === "all"
            ? "bg-accent text-black"
            : "bg-[#CCCCCC] text-muted-foreground"
        }`}
      >
        คำร้องทั้งหมด
      </button>

      <button
        type="button"
        onClick={() => onChangeTab?.("pending")}
        className={`px-12 py-2.5 rounded-full font-medium whitespace-nowrap transition duration-250 cursor-pointer ${
          activeTab === "pending"
            ? "bg-accent text-black"
            : "bg-[#CCCCCC] text-muted-foreground"
        }`}
      >
        รอดำเนินการ
      </button>
    </div>
  )
}