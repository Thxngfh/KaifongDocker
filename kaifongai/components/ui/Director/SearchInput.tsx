import { HiMagnifyingGlass } from "react-icons/hi2"

type ComplaintSearchInputProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function ComplaintSearchInput({
  value,
  onChange,
  placeholder = "ค้นหาเลขที่คำร้อง หรือชื่อผู้ยื่น...",
  className = "",
  inputClassName = "",
}: ComplaintSearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/70">
        <HiMagnifyingGlass/>
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full rounded-xl py-3 pl-12 pr-4 text-sm text-gray-700
          bg-white placeholder:text-gray-400
          focus:outline-none
          ${inputClassName}
        `}
      />
    </div>
  )
}