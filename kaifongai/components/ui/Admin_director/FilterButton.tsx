import { IoFilterSharp } from "react-icons/io5"

type FilterButtonProps = {
  onClick?: () => void
}

export default function FilterButton({ onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-xl whitespace-nowrap cursor-pointer"
    >
      <IoFilterSharp />
      กรองข้อมูล
    </button>
  )
}