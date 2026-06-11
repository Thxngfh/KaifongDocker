// app/api/form/card/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try{
      const body = await req.json()

      console.log("body:", body)
      const res = NextResponse.json({ ok: true })

      res.cookies.set("prefix", body.prefix)
      res.cookies.set("name", body.name)
      res.cookies.set("surname", body.surname)
      res.cookies.set("phone", body.phone)

      return res
  }catch (error){
    console.error("API Error:", error)  // ดู error จริงๆ
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
    const cookieStore = await cookies()

    // เพิ่มบรรทัดนี้
    console.log("prefix:", cookieStore.get("prefix")?.value)
    console.log("name:", cookieStore.get("name")?.value)
    console.log("surname:", cookieStore.get("surname")?.value)
    console.log("phone:", cookieStore.get("phone")?.value)

    return NextResponse.json({
        prefix: cookieStore.get("prefix")?.value ?? "",
        name: cookieStore.get("name")?.value ?? "",
        lastname: cookieStore.get("surname")?.value ?? "",
        phone: cookieStore.get("phone")?.value ?? "",
    })
}