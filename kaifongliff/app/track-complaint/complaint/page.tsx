"use client";

import { useEffect, useMemo, useState } from "react";
import { Sarabun } from 'next/font/google';

import { Header } from "@/components/complaint/Header";
import { StatusTabs, type TabKey } from "@/components/complaint/StatusTabs";
import { SearchBar } from "@/components/complaint/SearchBar";
import { RequestCard } from "@/components/complaint/RequestCard";
import Navbar from "@/components/navbar";
import type { ServiceRequest } from "@/lib/mockDB/requests.types";
import { RatingModal } from "@/components/complaint/RatingModal";
import { Pagination } from "@/components/Pagination";
import Link from "next/link";

const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

interface RequestsResponse {
  requests: ServiceRequest[];
  user: { name: string };
  counts: {
    all: number;
    in_progress: number;
    resolved: number;
    pending: number;
    paused: number;
  };
}

async function fetchRequests() {
  const res = await fetch("/api/complaint");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<RequestsResponse>;
}

// หน้าแสดงคำร้องทั้งหมดของ user
// กรองได้ตามสถานะ (tab) และค้นหาด้วยหมายเลขคำร้อง
export default function HomeClient() {
  const [data, setData]       = useState<RequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<TabKey>("all");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const result = await fetchRequests();
        setData(result);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // กรองคำร้องตาม tab และ search
  const filtered = useMemo<ServiceRequest[]>(() => {
    if (!data) return [];
    return data.requests.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (search && !r.complaintNo.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, tab, search]);

  // แบ่งหน้า
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo<ServiceRequest[]>(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // แบ่งกลุ่มสัปดาห์นี้ vs ก่อนหน้า
  const thisWeek = paginated.filter((r) => r.group === "this_week");
  const earlier  = paginated.filter((r) => r.group === "earlier");

  return (
    <div className={`${sarabun.className} min-h-screen pb-12`}>
      <Navbar />
      <div className="relative">
        <Header userName={data?.user.name ?? "ผู้ใช้งาน"} />

        <main className="relative z-10 mx-auto -mt-16 max-w-3xl space-y-6 px-5 sm:px-8">
          <div className="relative z-20">
            <StatusTabs
              active={tab}
              onChange={(t) => { setTab(t); setPage(1); }}
              counts={{
                all: 0, in_progress: 0, resolved: 0,
                paused: 0, pending: 0, rejected: 0,
                ...data?.counts,
              }}
            />
          </div>

          <div className="-mt-4">
            <SearchBar value={search} onChange={(s) => { setSearch(s); setPage(1); }} />
          </div>

          {isLoading && <p className="text-muted-foreground text-sm">กำลังโหลด...</p>}
          {error && <p className="text-destructive text-sm">{error}</p>}

          {thisWeek.length > 0 && <RequestSection title="สัปดาห์นี้" requests={thisWeek} />}
          {earlier.length > 0  && <RequestSection title="ก่อนหน้านี้" requests={earlier} />}

          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground py-12 text-center text-sm">
              ไม่พบรายการร้องเรียน
            </p>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </main>
      </div>
    </div>
  );
}

// section แสดงกลุ่มคำร้อง (สัปดาห์นี้ / ก่อนหน้านี้)
// จัดการ state ของ RatingModal อยู่ที่นี่
function RequestSection({
  title,
  requests,
}: {
  title: string;
  requests: ServiceRequest[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openRating, setOpenRating] = useState(false);

  const handleOpenRating = (id: string) => {
    setSelectedId(id);
    setOpenRating(true);
  };

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>

        {/* ส่ง id ไปหน้า details เพื่อดูรายละเอียด */}
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((r) => (
            <Link href={`/track-complaint/details?id=${r.id}`} key={r.id}>
              <RequestCard key={r.id} request={r} onRate={handleOpenRating} />
            </Link>
          ))}
        </div>

        <RatingModal
          open={openRating}
          requestId={selectedId}
          onClose={() => setOpenRating(false)}
          /*TODO: ต้องสร้าง API route api update rating สร้างไว้ในไฟล์ api ได้เลย เพื่อรับข้อมูลคะแนน*/
          onSubmit={async (data) => {
            try {
              // TODO: ส่งข้อมูลคะแนนและความเห็นไปยัง API
              // POST api endpoint เช่น /api/complaint/rating
              // Body: {
              // ใส่ข้อมุลตาม table rating ใน DB เช่น
              //   complaint_id: selectedId,
              //   rating: data.rating,  // 1-5
              //   comment: data.comment,  // ข้อความ
              // }
              console.log('Rating submitted:', selectedId, data);
            } catch (error) {
              console.error('Error submitting rating:', error);
            }
          }}
        />
      </section>
    </>
  );
}