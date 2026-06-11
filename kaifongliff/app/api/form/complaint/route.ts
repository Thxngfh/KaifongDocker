// app/api/form/complaint/route.ts
import { NextRequest, NextResponse } from "next/server"
import data from '@/data/mock_data_may2026.json'
import { cookies } from "next/headers" 

const { categories, subcategories } = data.meta.reference_ids
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        console.log("body:", body)
        const res = NextResponse.json({ ok: true })

        res.cookies.set("title",        body.title)
        res.cookies.set("category_id",     body.category_id)
        res.cookies.set("subcategory_id",  body.subcategory_id)
        res.cookies.set("detail",       body.detail)
        res.cookies.set("location",     body.location)
        res.cookies.set("latitude",     body.latitude)
        res.cookies.set("longitude",    body.longitude)
        res.cookies.set("geocoded_at",  body.geocoded_at)
        res.cookies.set("location_accuracy",    body.location_accuracy)
        res.cookies.set("province",     body.province)
        res.cookies.set("district",     body.district)
        res.cookies.set("additional",   body.additional)
        res.cookies.set("photoCount",   String((body.photos ?? []).length))

        return res
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

export async function GET() {
    const cookieStore = await cookies()

    const categoryId    = cookieStore.get("category_id")?.value    ?? ""
    const subcategoryId = cookieStore.get("subcategory_id")?.value ?? ""
    return NextResponse.json({
        title:        cookieStore.get("title")?.value       ?? "",
        category:     categories.find(c => c.category_id === categoryId)?.name,
        subcategory:  subcategories.find(c => c.subcategory_id === subcategoryId)?.name,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        detail:       cookieStore.get("detail")?.value      ?? "",
        location:     cookieStore.get("location")?.value    ?? "",
        latitude:     cookieStore.get("latitude")?.value    ?? "",
        longitude:    cookieStore.get("longitude")?.value   ?? "",
        geocoded_at:    cookieStore.get("geocoded_at")?.value   ?? "",
        location_accuracy:    cookieStore.get("location_accuracy")?.value   ?? "",
        province:     cookieStore.get("province")?.value    ?? "",
        district:     cookieStore.get("district")?.value    ?? "",
        additional:   cookieStore.get("additional")?.value  ?? "",
        photoCount:   Number(cookieStore.get("photoCount")?.value ?? "0"),
    })
}