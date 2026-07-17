// app/api/form/complaint/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers" 
import pool from "@/lib/db";

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
  const cookieStore = await cookies();

  const categoryId = cookieStore.get("category_id")?.value ?? "";
  const subcategoryId = cookieStore.get("subcategory_id")?.value ?? "";

  try {
    let categoryName = "";
    let subcategoryName = "";

    if (categoryId) {
      const categoryResult = await pool.query(
        `
        SELECT category_name
        FROM categories
        WHERE category_id = $1
        LIMIT 1
        `,
        [categoryId]
      );

      categoryName = categoryResult.rows[0]?.category_name ?? "";
    }

    if (subcategoryId) {
      const subcategoryResult = await pool.query(
        `
        SELECT subcategory_name
        FROM subcategories
        WHERE subcategory_id = $1
        LIMIT 1
        `,
        [subcategoryId]
      );

      subcategoryName = subcategoryResult.rows[0]?.subcategory_name ?? "";
    }

    return NextResponse.json({
      title: cookieStore.get("title")?.value ?? "",
      category: categoryName,
      subcategory: subcategoryName,
      categoryId: categoryId,
      subcategoryId: subcategoryId,
      detail: cookieStore.get("detail")?.value ?? "",
      location: cookieStore.get("location")?.value ?? "",
      latitude: cookieStore.get("latitude")?.value ?? "",
      longitude: cookieStore.get("longitude")?.value ?? "",
      geocoded_at: cookieStore.get("geocoded_at")?.value ?? "",
      location_accuracy: cookieStore.get("location_accuracy")?.value ?? "",
      province: cookieStore.get("province")?.value ?? "",
      district: cookieStore.get("district")?.value ?? "",
      additional: cookieStore.get("additional")?.value ?? "",
      photoCount: Number(cookieStore.get("photoCount")?.value ?? "0"),
    });
  } catch (error) {
    console.error("GET /api/form/complaint error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}