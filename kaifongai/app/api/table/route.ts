import { getCategories } from "@/services/DataProvider";

export async function GET() {
  const data = await getCategories();

  return Response.json({
    data
  });
}