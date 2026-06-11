import { usePhotoStore } from "@/hooks/usePhotoStore"
import { useState } from "react"

interface EvidenceImage {
    url?: string | null;
    filePath?: string | null;
    file_name?: string | null;
}

interface EvidenceCardProps {
    // URL string หรือ metadata รูปจาก DB
    // ถ้าไม่ส่งมา → ดึงจาก Zustand store (ใช้ตอนกรอกฟอร์ม)
    photos?: Array<string | EvidenceImage>
}

function EvidenceCard({ photos }: EvidenceCardProps) {
    const { photoPreviews } = usePhotoStore()
    const displayPhotos = photos ?? photoPreviews
    const [selectedPhoto, setSelectedPhoto] = useState<string | EvidenceImage | null>(null)

    // ดึง URL จาก item ไม่ว่าจะเป็น string หรือ object
    const getPhotoSrc = (item: string | EvidenceImage | null) => {
        if (!item) return ""
        if (typeof item === "string") return item
        return item.url ?? item.filePath ?? item.file_name ?? ""
    }

    return (
        <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex gap-2 m-3">
                <div className="w-1.5 h-6 rounded-md bg-[#725C00] mt-3"></div>
                <div>
                    <p className="text-lg font-bold text-[#1A1A2E]">หลักฐานประกอบ</p>
                    <p className="text-sm text-[#4D4632]">Supporting Evidence</p>
                </div>
            </div>

            {/* รูป thumbnail กดแล้วขยายใหญ่ */}
            <div className="grid grid-cols-3 m-3 gap-3">
                {displayPhotos.map((item, i) => {
                    const url = typeof item === "string" ? item : item.url ?? item.filePath ?? ""
                    const filePath = typeof item === "object" ? item.filePath : null
                    const fileName = typeof item === "object" ? item.file_name : null
                    return (
                        <div
                            key={i}
                            className="rounded-full w-18 h-18 overflow-hidden bg-[#f3f2ef] flex items-center justify-center cursor-pointer"
                            onClick={() => setSelectedPhoto(item)}
                        >
                            <img
                                src={url}
                                className="w-full h-full object-cover"
                                alt={`evidence-${i}`}
                                onError={(event) => {
                                    const target = event.currentTarget as HTMLImageElement
                                    console.error("Error loading evidence image", {
                                        url,
                                        filePath,
                                        file_name: fileName,
                                    })
                                    // โหลดไม่ได้ → ใช้รูป default
                                    target.src = "/evidence/Evidence_default.webp"
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* modal รูปขยาย กดข้างนอกหรือ ✕ เพื่อปิด */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/70"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        ✕
                    </button>

                    <img
                        src={getPhotoSrc(selectedPhoto)}
                        className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain"
                        alt="preview"
                        onError={(event) => {
                            const target = event.currentTarget as HTMLImageElement
                            const source = getPhotoSrc(selectedPhoto)
                            const fallbackPath = typeof selectedPhoto === "object"
                                ? selectedPhoto.filePath ?? selectedPhoto.url ?? selectedPhoto.file_name ?? ""
                                : ""
                            console.error("Error loading evidence modal image", {
                                source,
                                fallbackPath,
                                selectedPhoto,
                            })
                            // ลอง fallback path ก่อน ถ้าไม่มีหรือซ้ำกัน → รูป default
                            if (fallbackPath && fallbackPath !== source) {
                                target.src = fallbackPath
                                return
                            }
                            target.src = "/evidence/Evidence_default.webp"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default EvidenceCard