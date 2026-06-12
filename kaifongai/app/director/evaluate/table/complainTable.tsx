"use client"

import { useRouter } from "next/navigation"
import DataTable from "@/components/ui/Admin_director/DataTableBase"
import { Complaint } from "./complain"
import PersonCell from "./personCell"
import PhoneCell from "./phoneCell"
import StaffCell from "./staffCell"
import ChannelBadge from "./chanelBadge"
import StatusBadge from "./statusBadge"
import { IBM_Plex_Mono } from "next/font/google";


const monoFont = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
})


type Props = {
  columns: { key: string; title: string }[]
  data: Complaint[]
}

export default function ComplaintTable({ columns, data }: Props) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-[#EAEDFF] overflow-hidden mx-12 mt-10">
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          theadClassName="text-[#64748B] text-sm bg-foreground3 text-white h-16"
        >
          <tbody className="text-sm text-secondary">
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/director/evaluate/detail/${row.id}`)}
                className="border-b border-gray-200 h-20 hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-6 py-4 text-[#575E72]">{row.id}</td>
                <td className={` ${monoFont.className} px-6 py-4 text-[#725C00] font-medium`}>{row.problems}</td>
                <td className="px-6 py-4">
                  <ChannelBadge app={row.app} />
                </td>
                <td className="px-6 py-4 font-bold text-secondary">{row.title}</td>
                <td className="px-6 py-4">
                  <PersonCell person={row.person} />
                </td>
                <td className="px-6 py-4">
                  <PhoneCell phone={row.phone} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={row.status}/>
                </td>
                <td className="px-6 py-4">
                  <StaffCell staff={row.staff} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  )
}