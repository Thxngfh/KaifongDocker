import { RiMapPin2Line } from "react-icons/ri";
import type { ServiceRequest } from "@/lib/mockDB/requests.types";

type ComplaintCardProps = {
  request?: ServiceRequest;
  formData?: {
    category: string;
    subcategory?: string;
    location: string;
    detail: string;
    additional?: string;
  };
};

function ComplaintCard({ request, formData }: ComplaintCardProps) {
  const category = request?.category ?? formData?.category ?? "";
  const subcategory = request?.subcategory ?? formData?.subcategory ?? "";
  const location = request?.location ?? formData?.location ?? "";
  const detail = request?.detail ?? formData?.detail ?? "";
  const additional = request?.additional ?? formData?.additional ?? "";

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">

      <div className="flex gap-2 m-3">
        <div className="w-1.5 h-6 rounded-md bg-[#725C00] mt-3" />
        <div>
          <p className="text-lg font-bold text-[#1A1A2E]">รายละเอียดคำร้อง</p>
          <p className="text-sm text-[#4D4632]">Complaint Details</p>
        </div>
      </div>
<div className="m-3 space-y-2">
  {/* Category */}
  <div className="relative bg-[#4D4632]/7 rounded-[28px] px-4 py-3 overflow-hidden">
    <div className="absolute left-0 top-0 h-full w-[4px] bg-[#725C00]" />
    <div className="flex items-center gap-1 mb-0.5">
      <p className="text-[11px] font-semibold text-[#4D4632]/60">หัวข้อปัญหา</p>
      <p className="text-[9px] text-[#4D4632]/50">Category</p>
    </div>
    <p className="text-lg font-bold text-[#2F2A1F] break-words whitespace-normal">{category}</p>

    {/* Subcategory*/}
    <div className="mt-2">
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-[10px] font-semibold text-[#4D4632]/55">หัวข้อปัญหาย่อย</p>
        <p className="text-[9px] text-[#4D4632]/45">Subcategory</p>
      </div>
      <p className="text-sm font-semibold text-[#2F2A1F]/85 break-words whitespace-normal">{subcategory}</p>
    </div>
  </div>
</div>

      <div className="m-3">
        <span className="text-sm font-bold text-[#4D4632]/60">สถานที่เกิดเหตุ</span>
        <span className="px-2 text-[10px] text-[#4D4632]/60">Location</span>
        <div className="flex gap-2">
          <RiMapPin2Line className="w-9 h-6 text-[#725C00]" />
          <span className="text-md text-[#1A1A2E] font-semibold break-words whitespace-normal">{location}</span>
        </div>
      </div>
      
      <div className="m-3">
        <span className="text-sm font-bold text-[#4D4632]/60">คำอธิบาย</span>
        <span className="px-2 text-[10px] text-[#4D4632]/60">Details</span>
        <p className="text-md text-[#1A1A2E] break-words whitespace-normal">{detail}</p>
      </div>
      { additional && (
      <div className="m-3">
        <span className="text-sm font-bold text-[#4D4632]/60">คำอธิบายเพิ่มเติม</span>
        <span className="px-2 text-[10px] text-[#4D4632]/60">Additional Details</span>
          <div className="mt-1 rounded-lg border border-dashed border-[#725C00]/40 bg-[#725C00]/5 px-3 py-2">
            <p className="text-sm text-[#2F2A1F]/70 leading-relaxed break-words whitespace-normal">{additional}</p>
          </div>
      </div>
      )
      }

    </div>
  );
}

export default ComplaintCard;