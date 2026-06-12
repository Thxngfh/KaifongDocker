export default function StaffCell({ staff }: { staff: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="px-5 py-4 rounded-full text-xs font-bold bg-[#DAE2FA] text-foreground3">
        {staff.charAt(0)}
      </span>
      {staff}
    </div>
  )
}