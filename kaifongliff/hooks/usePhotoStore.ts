// hooks/usePhotoStore.ts
// Zustand store สำหรับจัดการรูปภาพที่ผู้ใช้เลือกระหว่างกรอกฟอร์ม
// เก็บทั้ง File (สำหรับ upload) และ preview URL (สำหรับแสดงผล)
// upload จริงจะเกิดตอน submit ฟอร์มเท่านั้น
import { create } from "zustand"

interface PhotoState {
    photos:        File[]     // ไฟล์จริงสำหรับ upload
    photoPreviews: string[]   // object URL สำหรับแสดง preview (index ตรงกับ photos)

    addPhoto:    (file: File) => void
    removePhoto: (index: number) => void
    clearPhotos: () => void
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
    photos:        [],
    photoPreviews: [],

    // เพิ่มรูป: สร้าง object URL จาก File สำหรับแสดง preview
    // URL.createObjectURL สร้าง URL ชั่วคราวใน memory ต้อง revoke เมื่อไม่ใช้แล้ว
    addPhoto: (file) => {
        const preview = URL.createObjectURL(file)
        set((state) => ({
            photos:        [...state.photos, file],
            photoPreviews: [...state.photoPreviews, preview],
        }))
    },

    // ลบรูปตาม index: revoke URL ก่อนลบเพื่อป้องกัน memory leak
    // แล้ว filter ทั้ง photos และ photoPreviews ออกพร้อมกัน
    removePhoto: (index) => {
        const { photos, photoPreviews } = get()
        URL.revokeObjectURL(photoPreviews[index])
        set({
            photos:        photos.filter((_, i) => i !== index),
            photoPreviews: photoPreviews.filter((_, i) => i !== index),
        })
    },

    // ล้างรูปทั้งหมด: revoke ทุก URL แล้ว reset state
    clearPhotos: () => {
        get().photoPreviews.forEach(URL.revokeObjectURL)
        set({ photos: [], photoPreviews: [] })
    },
}))
//revoke = ยกเลิก/ทำลาย
//memory leak = หน่วยความจำรั่ว — จองพื้นที่ไว้แล้วไม่ปล่อยคืน เหมือนจองโต๊ะร้านอาหารแล้วไม่มาและไม่ยกเลิก โต๊ะก็ว่างไม่ได้สักที ถ้าสะสมมากพอ browser ช้าหรือค้าง