"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { IoDocumentText } from "react-icons/io5";
import { MdOutlineClose, MdOutlineFileUpload, MdOutlineInsertDriveFile } from "react-icons/md";

type Props = {
  isOpen: boolean;
  action: () => void;
  initialData?: {
    title: string,
    description: string,
    date: string,
    datasize: string,
    filetype: string,
  }
};

export default function AddManualModal({
  isOpen,
  action,
  initialData,
}: Props) {
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTypeName(initialData.title);
        setTypeDesc(initialData.description);
        setFile(null);
        setPreviewUrl(null);
      } else {
        setTypeName("");
        setTypeDesc("");
        setFile(null);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-115 rounded-2xl p-5">

        {/* header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#333847]">
            {isEditMode ? "แก้ไขคู่มือ" : "อัพโหลดคู่มือใหม่"}
          </h2>

        </div>

        {/* form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();

            //บันทึก api

            action();
          }}
        >
          {/* title */}
          <input
            required
            placeholder="ชื่อไฟล์"
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

          {/* FileDrop Here */}
          {file ? (
            <div className="w-full border rounded-xl p-4 mb-3 bg-gray-50">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">ตัวอย่างไฟล์</p>
                  <p className="font-semibold text-base truncate cursor-context-menu" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {file.type || "ไม่สามารถระบุชนิดไฟล์"} · {formatFileSize(file.size)}
                  </p>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-full max-h-64 object-contain rounded-xl border items-center"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
                      <MdOutlineInsertDriveFile size={44} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <MdOutlineClose size={16} /> ลบไฟล์
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full mb-3">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer hover:border-black/20">
                <div className="flex flex-col items-center gap-3 text-center text-[#777777]">
                  <div className="bg-black/10 px-4 py-4 rounded-full">
                    <MdOutlineFileUpload size={28} />
                  </div>
                  <p className="text-lg font-semibold">อัพโหลดไฟล์</p>
                  <p className="text-sm text-muted-foreground">
                    คลิกเพื่อเลือกไฟล์หรือลากมาไว้ที่นี่
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {/* buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={action}
              className="px-4 py-2 rounded-xl hover:cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-accent font-bold hover:cursor-pointer"
            >
              {isEditMode ? "บันทึก" : "เพิ่มประเภท"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}