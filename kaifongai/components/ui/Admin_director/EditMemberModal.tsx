"use client";

import { Member } from "@/services/memberData";

type Props = {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave?: (data: Member) => void;
};

export default function EditMemberModal({
  isOpen,
  member,
  onClose,
  onSave,
}: Props) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] p-6 rounded-xl  ">

        <h2 className="text-xl font-bold text-[#333847] mb-4">แก้ไขข้อมูล</h2>

        {/* NAME */}
        <div className="mb-3">
          <label className="text-sm">ชื่อ</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={member.name}
          />
        </div>

        {/* LASTNAME */}
        <div className="mb-3">
          <label className="text-sm">นามสกุล</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={member.lastname}
          />
        </div>

        {/* EMAIL */}
        <div className="mb-3">
          <label className="text-sm">อีเมลล์</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={member.email}
          />
        </div>

        {/* DEPARTMENT */}
        <div className="mb-3">
          <label className="text-sm">หน่วยงาน</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={member.department}
          />
        </div>

        {/* TYPE */}
        <div className="mb-3">
          <label className="text-sm">ประเภทช่าง</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={member.technician_type}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1 hover:cursor-pointer"
            onClick={onClose}
          >
            ยกเลิก
          </button>

          <button
            className="px-4 py-2 rounded-xl bg-[#FFD100] font-bold hover:cursor-pointer"
            onClick={() => {
              onSave?.(member);
              onClose();
            }}
          >
            บันทึก
          </button>
        </div>

      </div>
    </div>
  );
}