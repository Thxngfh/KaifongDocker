import {
  MapPin,
  Star,
} from "lucide-react";

import { IoIosCheckmark } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";

import type { ServiceRequest } from "@/lib/mockDB/requests.types";

import {
  STATUS_ACCENT,
  STATUS_ICON_TILE,
  STATUS_LABEL,
  STATUS_PILL,
} from "../../lib/mockDB/status";

import { ProgressSteps } from "./ProgressSteps";
import { useRouter } from "next/navigation";
import { Clock3, Cog, CheckCircle2, XCircle, PauseCircle } from "lucide-react";

// ไอคอนประจำแต่ละสถานะ
const STATUS_ICON = {
  pending:     Clock3,
  in_progress: Cog,
  resolved:    CheckCircle2,
  rejected:    XCircle,
  paused:      PauseCircle,
} as const;

interface RequestCardProps {
  request: ServiceRequest;
  onRate?: (id: string) => void;
}

// card แสดงข้อมูลคำร้องแต่ละรายการในหน้า track-complaint
// กดแล้วไปหน้า details
export function RequestCard({ request, onRate }: RequestCardProps) {
  const accent = STATUS_ACCENT[request.status];
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(`/track-complaint/details?id=${request.id}`)}
      className="bg-card relative overflow-hidden rounded-2xl border border-border shadow-sm transition-shadow hover:shadow-md"
    >
      {/* แถบสีข้างซ้ายบอกสถานะ */}
      <div className={`absolute top-0 left-0 h-full w-1.5 ${accent}`} />

      <div className="space-y-4 p-4 pl-5 sm:p-5 sm:pl-6">
        {/* ป้ายสถานะ */}
        <div className="flex items-start justify-between gap-3">
          <StatusPill status={request.status} />
        </div>

        {/* หมายเลขคำร้อง + หมวดหมู่ */}
        <h3 className="text-base font-bold leading-snug sm:text-lg">
          {request.complaintNo} &nbsp;&nbsp;{request.title}
        </h3>

        {/* progress bar */}
        <ProgressSteps
          steps={3}
          progress={request.progress}
          fillClassName={accent}
          completedClassName="bg-status-done"
        />

        {/* แถบแสดง action note + ปุ่มให้คะแนน */}
        <DetailStrip request={request} onRate={onRate} />

        {/* footer: พื้นที่ + วันที่ */}
        <div className="text-muted-foreground flex items-center justify-between gap-3 pt-1 text-xs sm:text-sm">
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              เขต{request.district},{" "}{request.province}
            </span>
          </div>
          <span className="shrink-0">{request.date}</span>
        </div>
      </div>
    </article>
  );
}

// ป้ายแสดงสถานะ มีไอคอนและชื่อสถานะ
function StatusPill({ status }: { status: ServiceRequest["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_PILL[status]}`}
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
// ถ้า resolved และยังไม่ได้ให้คะแนน → แสดงปุ่มให้คะแนน
// ถ้าให้คะแนนแล้ว → แสดงดาว
// ป้องกันไม่ให้ click ปุ่มแล้ว navigate ไปหน้า details
export function DetailStrip({
  request,
  onRate,
}: {
  request: ServiceRequest;
  onRate?: (id: string) => void;
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
          {request.status === "pending" && (
            <span className="text-gray-400 mt-0.5 text-xs">{request.detailMeta}</span>
          )}
          {request.status !== "pending" && (
            <p className="text-gray-400 mt-0.5 text-xs">{request.detailMeta}</p>
          )}
        </div>
      </div>

      {/* ปุ่มให้คะแนน (แสดงเฉพาะ resolved ที่ยังไม่ได้ให้คะแนน) */}
      {request.status === "resolved" && request.rating == null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRate?.(request.id);
          }}
          className="bg-brand text-brand-foreground inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm hover:brightness-95"
        >
          ให้คะแนน
        </button>
      )}

      {/* ดาวคะแนนที่ให้ไปแล้ว */}
      {typeof request.rating === "number" && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < (request.rating ?? 0)
                  ? "fill-status-pending text-status-pending"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}