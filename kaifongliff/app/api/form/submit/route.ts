// app/api/form/submit/route.ts
import { NextRequest, NextResponse } from "next/server"
//ตอนกด submit จะลงข้อมุลที่ได้จากฟอร์ม เข้าระบบ
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log("Form Data:", body)

        return NextResponse.json({ ok: true, data: body }) 
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

//insert ข้อมุล เข้าตาราง user, compaints, workload, complaint_file

//ต้องเก็บข้อมุลลงตาราง user ก่อน จะมีหลักๆนะ user_line_id titlename firstname lastname phone  
//พอได้แล้วมันจะดึง userId จาก last (ส่วนตารางที่ใส่ไปอันล่าสุดที่เชื่อมกับ user_line_id ที่ user login เข้ามา)

//ให้เอา userId มาใส่ใน ตาราง complaint 
//แล้วให้เอา complaintId ใส่เข้า workflow complaint_file ต่อไป