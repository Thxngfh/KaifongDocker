"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string }) => void;
  requestId?: string | null;
}

// modal ให้คะแนนความพึงพอใจหลัง complaint ถูก resolved
// แสดงรูปหลักฐานจาก technician + ดาว 1-5 + ข้อเสนอแนะ
export function RatingModal({
  open,
  onClose,
  onSubmit,
  requestId,
}: RatingModalProps) {
  const [hovered, setHovered]   = useState(0);  // ดาวที่ hover อยู่
  const [selected, setSelected] = useState(0);  // ดาวที่เลือกแล้ว

  const [comment, setComment]           = useState("");
  const [imageUrl, setImageUrl]         = useState<string | null>(null);
  const [altText, setAltText]           = useState<string>("รูปประกอบการประเมิน");
  const [primaryPath, setPrimaryPath]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // reset ทุก state กลับค่าเริ่มต้น
  const resetForm = () => {
    setHovered(0);
    setSelected(0);
    setComment("");
    setImageUrl(null);
    setAltText("รูปประกอบการประเมิน");
    setPrimaryPath(null);
    setIsSubmitting(false);
    setShowSuccessMessage(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // โหลดรูปหลักฐานเมื่อ modal เปิด
  // อนาคตจะขอข้อมูลรูปหลักฐานที่เสร็จสิ้นจาก technician
  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    let mounted = true;
    setImageUrl(null);
    if (!requestId) {
      setImageUrl("/evidence/Evidence_success2.jpg");
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const res = "" /*await fetch(`/api/complaint/${requestId}`) <--อันเก่าขอมาจาก user ซึ่งไม่ใช่ */
        //อนาคตจะขอ ข้อมุลรูปหลักฐานที่เสร็จสิ้นจาก technician 
 /*
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
      
        const imgs = data.images ?? [];
        const primary = imgs.find((i: any) => i.is_primary === true) ?? imgs[0];
        
        const url = primary?.url ?? primary?.filePath ?? "/evidence/Evidence_success2.jpg";
        const path = primary?.filePath ?? primary?.file_url ?? primary?.file_name ?? "";
        */
        if (mounted) {
          if (mounted) setImageUrl("/evidence/Evidence_success2.jpg");
          /*
          setImageUrl(url);
          setPrimaryPath(path || null);
          
          setAltText(`${requestId ?? ""} ${path}`.trim() || "รูปประกอบการประเมิน");
          */
        }
      } catch (e) {
        // โหลดรูปไม่ได้ → ใช้รูป default แทน
        if (mounted) setImageUrl("/evidence/Evidence_default.webp");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [requestId, open]);

  if (!open) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    // ส่งข้อมูลคะแนนและความเห็นไปให้ parent
    onSubmit({
      rating: selected,
      comment: comment,
    });
    setShowSuccessMessage(true);
    // รีเฟรชหน้าหลังส่งคะแนนเพื่ออัปเดต rating ใน RequestCard
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl">

        {/* top */}
        <div className="mb-4 flex flex-col items-center text-center w-full">
          <h2 className="text-lg font-bold">ประเมินความพึงพอใจ</h2>

          <div className="my-4">
            {/* load image from complaint detail by id (prefer is_primary) */}
            {imageUrl ? (
              <img
                src={imageUrl}
                className="rounded-xl w-40 h-40 object-cover"
                alt={altText}
                onError={() => {
                  // โหลดรูปไม่ได้ → fallback รูป default
                  setImageUrl("/evidence/Evidence_default.webp");
                  setAltText(`${requestId ?? ""} ${primaryPath ?? ""}`.trim() || "รูปประกอบการประเมิน");
                }}
              />
            ) : (
              <div className="rounded-xl w-40 h-40 bg-[#f3f2ef] flex items-center justify-center text-sm">
                กำลังโหลดรูป...
              </div>
            )}
          </div>

          <p className="text-muted-foreground text-sm">
            กรุณาเลือกดาวตามความพอใจของท่าน
          </p>
        </div>

        {/* toast แจ้งส่งคะแนนสำเร็จ */}
        {showSuccessMessage && (
          <div
            role="status"
            className="fixed left-1/2 top-6 z-60 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-emerald-200 bg-emerald-50/95 px-5 py-4 text-sm text-emerald-900 shadow-[0_20px_45px_-20px_rgba(22,163,74,0.65)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-center gap-2 font-medium">
              <span>✅ ส่งคะแนนเสร็จสิ้นแล้ว</span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-2">
              <p className="text-center text-xs text-emerald-700">
                กำลังรีเฟรชหน้าให้ใหม่อัตโนมัติ
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 animate-pulse" style={{ animationDelay: '120ms' }} />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 animate-pulse" style={{ animationDelay: '240ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* stars: hover preview + click เลือก */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const active = hovered >= value || selected >= value;
            return (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(value)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    active
                      ? "fill-status-pending text-status-pending"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* ข้อเสนอแนะ จำกัด 200 ตัวอักษร */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">ข้อเสนอแนะ</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            maxLength={200}
            placeholder="เขียนความคิดเห็นเพิ่มเติม..."
            className="border border-gray-300 bg-background min-h-20 w-full rounded-xl p-3 text-sm outline-none focus:ring-2"
          />
          <div className="text-muted-foreground text-right text-xs">
            {comment.length}/200
          </div>
        </div>

        {/* actions: ยกเลิก / ส่งคะแนน (disabled ถ้ายังไม่เลือกดาว) */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-border hover:bg-muted flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={!selected || isSubmitting}
            onClick={handleSubmit}
            className="bg-brand text-brand-foreground disabled:bg-muted disabled:text-muted-foreground flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "กำลังส่ง..." : "ส่งคะแนน"}
          </button>
        </div>

      </div>
    </div>
  );
}