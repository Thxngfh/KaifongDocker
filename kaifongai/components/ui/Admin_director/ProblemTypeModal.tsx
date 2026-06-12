"use client";

import { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import th from "emoji-picker-react/dist/data/emojis-th";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: number;
    name: string;
    description: string;
    emoji: string;
  } | null;
};

export default function AddProblemTypeModal({
  isOpen,
  onClose,
  initialData,
}: Props) {
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [typeEmoji, setTypeEmoji] = useState("📝");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTypeName(initialData.name);
        setTypeDesc(initialData.description);
        setTypeEmoji(initialData.emoji);
      } else {
        setTypeName("");
        setTypeDesc("");
        setTypeEmoji("📝");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[460px] rounded-2xl p-5">

        {/* header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#333847]">
            {isEditMode ? "แก้ไขประเภทปัญหา" : "เพิ่มประเภทใหม่"}
          </h2>

        </div>

        {/* form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();

            //บันทึก api

            onClose();
          }}
        >
          {/* name */}
          <input
            required
            placeholder="ชื่อประเภท"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 mb-3"
          />

          {/* description */}
          <textarea
            required
            placeholder="คำอธิบาย"
            value={typeDesc}
            onChange={(e) => setTypeDesc(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 h-20 resize-none mb-3"
          />

          {/* preview */}
          <div className="mb-3">
            <p className="font-semibold mb-2 text-sm">
              Emoji ที่เลือก
            </p>

            <div className="w-12 h-12 border rounded-xl flex items-center justify-center text-2xl">
              {typeEmoji}
            </div>
          </div>

          {/* picker */}
          <div className="border rounded-2xl overflow-hidden">
            <EmojiPicker
              emojiData={th}
              width="100%"
              height={300}
              searchPlaceHolder="ค้นหา อีโมจิ"
              previewConfig={{ showPreview: false }}
              onEmojiClick={(emojiData) =>
                setTypeEmoji(emojiData.emoji)
              }
            />
          </div>

          {/* buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#FFD100] font-bold hover:cursor-pointer"
            >
              {isEditMode ? "บันทึก" : "เพิ่มประเภท"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}