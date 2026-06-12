import { MdOutlineLocalPhone } from "react-icons/md"

export default function PhoneCell({ phone }: { phone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#725C00]">
        <MdOutlineLocalPhone size={18} />
      </span>
      {phone}
    </div>
  )
}