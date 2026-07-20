// app/api/summary/route.ts
//
// เดิม: ดึง complaints/workflow_logs "ทุกแถว" ออกมาทั้งหมด แล้วมานับด้วย
// JavaScript ผ่าน summaryDashboard.ts (.filter()) — พอข้อมูลมี 30,000+ แถว
// จะช้ามาก (เจอจริงตอนวัด 30-58 วินาที)
//
// ใหม่: ให้ PostgreSQL นับสรุปให้โดยตรง (COUNT/AVG/GROUP BY) เร็วกว่ามาก
// รูปแบบ JSON ที่ส่งออกไปยังคงเหมือนเดิมทุกฟิลด์ (topCards, bottomCards,
// RankingCards) เพื่อไม่ให้หน้า Admin dashboard เดิมพัง — ไม่ต้องแก้ฝั่ง
// frontend เลย

import { NextResponse } from "next/server";
import pool from "@/lib/db";

interface SummaryItem {
  title: string;
  value: number;
  subvalue?: string | number;
  color?: string;
}

export async function GET() {
  try {
    const summary = await getSummaryFast();
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("DB ERROR (/api/summary):", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

async function getSummaryFast() {
  // ── การ์ดตัวเลข (1 query เดียว นับทุกอย่างพร้อมกัน) ──────────────
  const countsResult = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE LOWER(st.status_code) = 'pending')                       AS pending,
      COUNT(*) FILTER (WHERE LOWER(st.status_code) = 'resolved')                      AS resolved,
      COUNT(*) FILTER (WHERE c.created_at::date = CURRENT_DATE)                       AS today,
      COUNT(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '7 days')               AS week,
      COUNT(*) FILTER (WHERE date_trunc('month', c.created_at) = date_trunc('month', NOW())) AS month,
      COUNT(*)                                                                        AS total
    FROM complaints c
    LEFT JOIN status_master st ON c.current_status_id = st.status_id
  `);
  const counts = countsResult.rows[0];

  // ── เวลาเฉลี่ยในการปิดงาน (เฉพาะเคสที่ resolved แล้ว) ──────────────
  // หาเวลาที่เข้าสถานะ pending ครั้งแรก กับ resolved ครั้งล่าสุด จาก workflow_logs
  // แล้วเฉลี่ยผลต่างเป็นวัน — เทียบเท่ากับ summaryAvgCloseTime() เดิมทุกประการ
  const avgCloseResult = await pool.query(`
    WITH first_pending AS (
      SELECT wl.complaint_id, MIN(wl.action_datetime) AS pending_at
      FROM workflow_logs wl
      JOIN status_master st ON wl.to_status_id = st.status_id
      WHERE LOWER(st.status_code) = 'pending'
      GROUP BY wl.complaint_id
    ),
    last_resolved AS (
      SELECT wl.complaint_id, MAX(wl.action_datetime) AS resolved_at
      FROM workflow_logs wl
      JOIN status_master st ON wl.to_status_id = st.status_id
      WHERE LOWER(st.status_code) = 'resolved'
      GROUP BY wl.complaint_id
    )
    SELECT AVG(EXTRACT(EPOCH FROM (lr.resolved_at - fp.pending_at)) / 86400.0) AS avg_days
    FROM complaints c
    LEFT JOIN status_master cs ON c.current_status_id = cs.status_id
    JOIN first_pending fp ON fp.complaint_id = c.complaint_id
    JOIN last_resolved lr ON lr.complaint_id = c.complaint_id
    WHERE LOWER(cs.status_code) = 'resolved'
  `);
  const avgCloseDays = Number(avgCloseResult.rows[0]?.avg_days || 0);

  // ── Top 3 ประเภทปัญหาที่มีเรื่องมากที่สุด (แทน getRanking เดิม) ──────
  const rankingResult = await pool.query(`
    SELECT cat.category_id, cat.category_name, cat.description, COUNT(*) AS cnt
    FROM complaints c
    JOIN categories cat ON c.category_id = cat.category_id
    GROUP BY cat.category_id, cat.category_name, cat.description
    ORDER BY cnt DESC
    LIMIT 3
  `);
  const totalCases = Number(counts.total || 0);

  const topCards: SummaryItem[] = [
    { title: "รอดำเนินการ", value: Number(counts.pending), color: "#BA1A1A" },
    { title: "แก้ไขเสร็จสิ้นแล้ว", value: Number(counts.resolved), color: "#059669" },
    { title: "เวลาเฉลี่ยในการปิดงาน", value: Number(avgCloseDays.toFixed(2)), subvalue: "วัน", color: "#FFD100" },
  ];

  const bottomCards: SummaryItem[] = [
    { title: "เรื่องที่ร้องเรียนวันนี้", value: Number(counts.today), color: "#725C00" },
    { title: "ร้องเรียนใหม่สัปดาห์นี้", value: Number(counts.week) },
    { title: "เรื่องที่ร้องเรียนเดือนนี้", value: Number(counts.month), color: "#FFD100" },
  ];

  const RankingCards = rankingResult.rows.map((p, idx) => ({
    key: idx + 1,
    id: p.category_id,
    title: p.category_name,
    value: p.description,
    subvalue: totalCases > 0 ? Math.round((Number(p.cnt) / totalCases) * 100) : 0,
  }));

  return { topCards, bottomCards, RankingCards };
}