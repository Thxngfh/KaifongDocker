import { FaRegUser } from "react-icons/fa"

export default function PersonCell({ person }: { person: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#725C00]">
        <FaRegUser />
      </span>
      {person}
    </div>
  )
}