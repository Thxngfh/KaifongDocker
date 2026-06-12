import { GoPlus } from "react-icons/go";

type FilterButtonProps = {
  onClick?: () => void
}

export default function AddButton({ onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-xl whitespace-nowrap cursor-pointer font-semibold"
    >
      <GoPlus size={20} strokeWidth={1}/>
      เพิ่มประเภทใหม่
    </button>
  )
}