/*
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
*/

// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// โฟลเดอร์ปลายทาง — ตรงกับที่ mount volume ไว้ใน docker-compose.yml (./kaifongliff/uploads:/app/public/uploads)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

// รับไฟล์จาก client ที่ compress มาแล้ว → rotate ตาม EXIF → เขียนลง disk บนเซิฟเวอร์ → return metadata
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

        // สุ่มชื่อไฟล์เสมอ ป้องกันชื่อซ้ำ/ป้องกันคนเดารูปคนอื่นได้จาก URL
        const originalName = file.name?.trim() ?? ''
        const nameBase = originalName
            ? originalName.replace(/\.[^/.]+$/, '')
            : 'photo'
        const safeName = nameBase.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_') // กันอักขระแปลกปลอมใน path
        const uploadName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${safeName}.jpg`

        // สร้างโฟลเดอร์ถ้ายังไม่มี (กันพลาดตอน volume ว่างเปล่าครั้งแรก)
        await mkdir(UPLOAD_DIR, { recursive: true })

        const filePath = path.join(UPLOAD_DIR, uploadName)
        await writeFile(filePath, compressed)

        // Next.js เสิร์ฟไฟล์ใต้ public/ ที่ root path อัตโนมัติ เช่น public/uploads/x.jpg → /uploads/x.jpg
        const publicUrl = `/uploads/${uploadName}`

        console.log("before:", buffer.length, "after:", compressed.length)

        return NextResponse.json({
            file_url:  publicUrl,   // เก็บ path สัมพัทธ์ไว้ก่อน (ต่อ domain เองตอนแสดงผล)
            file_type: "image",
            file_name: uploadName,
            file_path: publicUrl,
            file_size: compressed.length,
            mime_type: "image/jpeg",
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
    }
}