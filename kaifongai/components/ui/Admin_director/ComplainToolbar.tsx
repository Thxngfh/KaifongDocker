import ComplaintStatusTabs from "../Admin_director/ComplainStatusTab"
import ComplaintSearchInput from "../Admin_director/ComplainSearchInput"
import FilterButton from "../Admin_director/FilterButton"
import ExportButton from "../Admin_director/ExportDecumentButton"

type ComplaintToolbarProps = {
  activeTab: "all" | "pending"
  onChangeTab?: (tab: "all" | "pending") => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  onFilterClick?: () => void
  onExportClick?: () => void
}

export default function ComplaintToolbar({
  activeTab,
  onChangeTab,
  searchValue,
  onSearchChange,
  onFilterClick,
  onExportClick,
}: ComplaintToolbarProps) {

  return (
    <div className="flex items-center justify-between gap-6 mb-6 pl-10">
      <ComplaintStatusTabs
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

      <div className="flex items-center justify-end gap-4 flex-1 ">
        <ComplaintSearchInput
          value={searchValue}
          onChange={onSearchChange}
        />
        <FilterButton onClick={onFilterClick} />
        <ExportButton onClick={onExportClick} />
      </div>
    </div>
  )
}