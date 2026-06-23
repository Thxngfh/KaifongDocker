// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"

// รับไฟล์จาก client ที่ compress มาแล้ว → rotate ตาม EXIF → อัปโหลดลง Vercel Blob → return metadata
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // client compress มาแล้ว → server แค่หมุนรูปตาม EXIF orientation เท่านั้น
        const compressed = await sharp(buffer)
            .rotate()
            .jpeg({ quality: 85 })
            .toBuffer()

        // ถ้าไม่มีชื่อไฟล์จาก client → สุ่มชื่อให้เพื่อป้องกันไฟล์ซ้ำ
        const originalName = file.name?.trim() ?? ''
        const nameBase = originalName
            ? originalName.replace(/\.[^/.]+$/, '')
            : `upload-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
        const uploadName = `${nameBase}.jpg`

        const blob = await put(uploadName, compressed, {
            access: "public",
            addRandomSuffix: true,
            contentType: "image/jpeg",
        })

        const file_path = new URL(blob.url).pathname

        console.log("before:", buffer.length, "after:", compressed.length)

        return NextResponse.json({
            file_url:  blob.url,
            file_type: "image",
            file_name: uploadName,
            file_path: file_path,
            file_size: compressed.length,
            mime_type: "image/jpeg",
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
    }
}
