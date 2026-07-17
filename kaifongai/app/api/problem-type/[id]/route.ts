import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
        const categoryResult = await pool.query(
      `
      SELECT
        category_id,
        category_name
      FROM categories
      WHERE category_id = $1
      LIMIT 1
      `,
      [id]
    );

        if (categoryResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        {
          status: 404,
        }
      );
    }

            const subcategoryResult = await pool.query(
        `
        SELECT
            sub.subcategory_id,
            sub.subcategory_name,
            COUNT(c.complaint_id) AS total_cases
        FROM subcategories sub
        LEFT JOIN complaints c
            ON c.subcategory_id = sub.subcategory_id
        WHERE sub.category_id = $1
        GROUP BY
            sub.subcategory_id,
            sub.subcategory_name
        ORDER BY sub.subcategory_name ASC
        `,
        [id]
        );

        const data = subcategoryResult.rows.map(
        (row, index) => ({
            id: index + 1,
            subcategory_id: row.subcategory_id,
            name: row.subcategory_name,

            // ในหน้า KaifongAI จะนำคำอธิบายจาก subProblemInfoMap มาใส่อีกที
            description: "",

            // หน้า KaifongAI เดิมกำหนดรายการจาก mock ให้เปิดใช้งานทั้งหมด
            is_active: true,

            total_cases: Number(row.total_cases),
        })
        );

        const summary = {
      total: data.length,
      active: data.filter(
        (item) => item.is_active
      ).length,
      inactive: data.filter(
        (item) => !item.is_active
      ).length,
    };

        return NextResponse.json({
      category: {
        id: categoryResult.rows[0].category_id,
        name: categoryResult.rows[0].category_name,
      },
      data,
      summary,
    });

      } catch (error: unknown) {
    console.error(
      "DB ERROR (/api/problem-type/[id]):",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}