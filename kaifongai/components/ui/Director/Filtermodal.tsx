type Props = {
  isOpen: boolean
  onClose: () => void

  statusOptions: string[]
  selectedStatus: string[]
  setSelectedStatus: (value: string[]) => void

  problemOptions: string[]
  selectedProblems: string[]
  setSelectedProblems: (value: string[]) => void
}

const problemImageMap: Record<string, string> = {
  "ไฟฟ้าขัดข้อง": "⚡",
  "ถนนชำรุด": "🛣️",
  "น้ำประปาขัดข้อง": "💧",
  "ขยะและสิ่งแวดล้อม": "🗑️",
  "ต้นไม้และพื้นที่สาธารณะ": "🌳",
  "ท่อระบายน้ำ": "🕳️",
}

export default function EvaluateFilterModal({
  isOpen,
  onClose,

  statusOptions,
  selectedStatus,
  setSelectedStatus,

  problemOptions,
  selectedProblems,
  setSelectedProblems,
}: Props) {
  if (!isOpen) return null

  const toggle = (
    value: string,
    selected: string[],
    setSelected: (value: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const clearAll = () => {
    setSelectedStatus([])
    setSelectedProblems([])
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="w-[430px] rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#333847]">
            กรองข้อมูล
          </h2>

          <button
            onClick={onClose}
            className="text-lg text-gray-400 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* STATUS */}
        <div className="mb-6">
          <p className="mb-3 font-semibold text-[#333847]">
            สถานะ
          </p>

          <div className="space-y-2">
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(status)}
                  onChange={() =>
                    toggle(
                      status,
                      selectedStatus,
                      setSelectedStatus
                    )
                  }
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PROBLEM TYPE */}
        <div className="mb-6">
          <p className="mb-3 font-semibold text-[#333847]">
            ประเภทปัญหา
          </p>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {problemOptions.map((problem) => (
              <label
                key={problem}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedProblems.includes(problem)}
                  onChange={() =>
                    toggle(
                      problem,
                      selectedProblems,
                      setSelectedProblems
                    )
                  }
                />

                <span>
                  {problemImageMap[problem]} {problem}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={clearAll}
            className="rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-100"
          >
            ล้าง
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-[#FFD100] px-5 py-2 font-bold text-black hover:brightness-95"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  )
}