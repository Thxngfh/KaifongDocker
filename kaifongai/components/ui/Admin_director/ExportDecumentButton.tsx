import { GrDocumentText } from "react-icons/gr"

type ExportButtonProps = {
  onClick?: () => void
}

export default function ExportButton({ onClick }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-foreground3 text-white px-6 py-3 rounded-xl whitespace-nowrap cursor-pointer"
    >
      <GrDocumentText />
      ออกรายงาน
    </button>
  )
}