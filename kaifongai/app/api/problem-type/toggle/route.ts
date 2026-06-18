import { toggleCategoryStatus } from "@/services/DataProvider";

export async function POST(req: Request) {
  const { category_id, is_active } = await req.json();

  if (!category_id) {
    return Response.json(
      { error: "category_id is required" },
      { status: 400 }
    );
  }

  const data = await toggleCategoryStatus(category_id, is_active);

  return Response.json({ data });
}