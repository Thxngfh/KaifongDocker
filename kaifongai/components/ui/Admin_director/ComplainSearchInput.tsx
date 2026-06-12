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
  placeholder = "ค้นหาเลขที่คำร้อง ชื่อผู้ยื่น หรือชื่อเจ้าหน้าที่...",
  className = "",
  inputClassName = "",
}: ComplaintSearchInputProps) {
  return (
    <div className={`relative w-full max-w-[400px] ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="#7F765F"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full border border-[#D1C6AB]/30 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none
          ${inputClassName}
        `}
      />
    </div>
  )
}