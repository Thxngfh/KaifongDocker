// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"

//ฟังชันก์นี้เอาไว้ รับไฟล์รูปภาพจากฟอร์ม → ปรับภาพและบีบอัด → อัปโหลดลง Vercel Blob (อนาคตมี server สามารถปรับเปลี่ยนที่หรือใช้อย่างอื่นได้)→ return metadata
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
         
        /*ถ้าส่วนไหนไม่จำเปนสามารถตัดทิ้งได้หรือขนาดและ size อยากปรับเพิ่มเติมก็สามารถทำได้ */
        // จัดการรูปภาพเบื้องต้น (หมุนรูป + ปรับขนาด)
        const basePipeline = () => sharp(buffer)
            .rotate()
            .resize({ width: 1024, fit: "inside", withoutEnlargement: true })

        // พยายามบีบอัดไฟล์ให้เล็กลงเพื่อพื้นที่แต่ไม่บีบมากเกินเพื่อให้ภาพยังมีรายละเอียดสำหรับ ML
        const TARGET_BYTES = 600 * 1024 // เป้าหมายประมาณ 600 KB
        let compressed: Buffer | null = null
        const minQuality = 70
        /*
        ลอจิก:
        เริ่มจาก quality สูงสุด (90) → compress → เช็คขนาด
        ถ้า out.length <= 600KB → ได้แล้ว เก็บ break ออก
        ถ้ายังใหญ่เกิน → ลด quality ลง 10 แล้วลองใหม่
        ถ้าถึง q === minQuality (70) แล้วยังใหญ่อยู่ → ยอมรับไปเลย ไม่ลดต่ออีก

        q=90 → 900KB  (เกิน, ลองต่อ)
        q=80 → 650KB  (เกิน, ลองต่อ)
        q=70 → 450KB  (≤600KB หรือ q==minQuality → เก็บ, break)
        */
        for (let q = 90; q >= minQuality; q -= 10) {
            try {
                const out = await basePipeline().jpeg({ quality: q }).toBuffer()
                if (out.length <= TARGET_BYTES || q === minQuality) {
                    compressed = out
                    console.log(`compress: chosen quality=${q}, size=${out.length}`)
                    break
                }
            } catch (err) {
                console.warn('sharp compress attempt failed at quality', q, err)
            }
        }

        // ถ้าบีบอัดรูปไม่สำเร็จ 
        if (!compressed) {
            throw new Error("Failed to compress image")
        }

        // ตั้งชื่อไฟล์ที่อัปโหลดให้เป็น .jpg ตามฟอร์แมตที่ได้
        
        const originalName = file.name?.trim() ?? ''
        // ถ้าไม่มีชื่อไฟล์จาก client จะสุ่มชื่อให้เพื่อป้องกันไฟล์ซ้ำ
        const nameBase = originalName
            ? originalName.replace(/\.[^/.]+$/, '') //ตัดสกุล
            : `upload-${Date.now()}-${Math.floor(Math.random() * 1000000)}` 
        const uploadName = `${nameBase}.jpg` //ใส่สกุล jpg เพราะคิดว่าใช้ได้ทั่วไป แต่จริงๆแล้ว webp ขนาดกับความคมดีกว่า แต่ไม่แน่ใจว่า ML จะยังใช้ได้ไหม ถ้าได้ใช้ webp ดีกว่า
        
        //อัพโหลดไป Vercel Blob Storage
        //แต่ถ้ามี server แล้วเก็บเปน path หรือบันทึกรูปเข้า db ตรงๆให้ลบออกได้
        const blob = await put(uploadName, compressed, {
            access: "public",
            addRandomSuffix: true,
            contentType: "image/jpeg",
        })
        //ถ้ามี server ก้เก็บเข้า folder สำหรับตอนนี้คือเขียนไว้เฉยๆ เปนข้อมุล  
        //path ที่คิดไว้ complaints/{complaint_id}/{file_id}.{ext} แต่ยังไม่ได้เอามาใช้
         const file_path = new URL(blob.url).pathname 
        //เช็คว่า compressed แล้วเท่าไหร่
        console.log("before compress:", buffer.length, "after compress:", compressed.length)

        return NextResponse.json({ 
            file_url: blob.url, //ถ้ามี server เปลี่ยนเป็น URL ที่เข้าถึงได้จริงตาม server นั้นๆ
            file_type: "image", 
            file_name: uploadName,
            file_path: file_path, 
            file_size: compressed.length,
            mime_type: "image/jpeg", //หลัง convert
            
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
    }
}


