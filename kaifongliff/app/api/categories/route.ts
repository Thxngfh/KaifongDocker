import pool from "@/lib/db";

export async function GET() {
  const { rows: categories } = await pool.query(
    `SELECT category_id, category_name FROM categories WHERE is_active = true ORDER BY display_order`
  );
  const { rows: subcategories } = await pool.query(
    `SELECT subcategory_id, category_id, subcategory_name FROM subcategories ORDER BY subcategory_name`
  );
  return Response.json({ categories, subcategories });
}