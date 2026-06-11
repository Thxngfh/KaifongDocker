import { IoIosCheckmark } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";

import {
  STATUS_ICON_TILE,
  STATUS_LABEL,
  STATUS_PILL,
} from "../../lib/mockDB/status";

import type { ServiceRequest } from "@/lib/mockDB/requests.types";

import { Clock3, Cog, CheckCircle2, XCircle, PauseCircle } from "lucide-react";

// ไอคอนประจำแต่ละสถานะ
const STATUS_ICON = {
  pending:     Clock3,
  in_progress: Cog,
  resolved:    CheckCircle2,
  rejected:    XCircle,
  paused:      PauseCircle,
} as const;

type StatusCardProps = {
  request: ServiceRequest;
};

// card แสดงสถานะในหน้า details
function StatusCard({ request }: StatusCardProps) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">

      <div className="flex gap-2 m-3">
        {/* แถบสีข้างซ้าย */}
        <div className="w-1.5 h-6 rounded-md bg-[#725C00] mt-3"></div>
        <div>
          <p className="text-lg font-bold text-[#1A1A2E]">สถานะ</p>
          <p className="text-sm text-[#4D4632]">Status</p>
        </div>
      </div>

      {/* ป้ายสถานะ */}
      <div className="m-3 mt-6">
        <StatusPill status={request.status} />
      </div>

      {/* แถบแสดง action note */}
      <div className="m-3 mt-6">
        <DetailStrip request={request} />
      </div>

    </div>
  );
}
export default StatusCard;

// ป้ายแสดงสถานะ มีไอคอนและชื่อสถานะ
function StatusPill({ status }: { status: ServiceRequest["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-4.5 py-2 text-xs font-medium ${STATUS_PILL[status]}`}
    >
      {STATUS_LABEL[status] === "เสร็จสิ้น" ? (
        <IoIosCheckmark className="text-sm" />
      ) : STATUS_LABEL[status] === "พักงาน" ? (
        <FaArrowRight className="text-[10px]" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

// แถบแสดง action note + detailMeta
// ใช้ร่วมกับ RequestCard ในหน้า track-complaint ด้วย
export function DetailStrip({
  request,
}: {
  request: ServiceRequest;
}) {
  const tone = STATUS_ICON_TILE[request.status];
  const Icon = STATUS_ICON[request.status] ?? Clock3;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm ${
        request.status === "paused" ? "bg-muted/60" : tone
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Icon className="mt-1 h-4 w-4 shrink-0" />

        <div className="min-w-0">
          <span className="font-medium leading-snug">{request.actionNote}</span>

          {/* pending แสดงเวลาที่รอ inline, อื่นๆ ขึ้นบรรทัดใหม่ */}
          {request.status === "pending" && (
            <span className="text-gray-400 mt-0.5 text-xs">{request.detailMeta}</span>
          )}
          {request.status !== "pending" && (
            <p className="text-gray-400 mt-0.5 text-xs">{request.detailMeta}</p>
          )}
        </div>
      </div>
    </div>
  );
}
