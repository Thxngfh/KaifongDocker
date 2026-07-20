"use client";

// app/director/dashboard/sla/page.tsx
// พอร์ตมาจาก complaint_frontend/src/App.js → AnalyticsPage (บรรทัด 1320-1642)
// แผนที่ OpenStreetMap (react-leaflet) รวมอยู่ในไฟล์นี้ไฟล์เดียว —
// โหลด react-leaflet ผ่าน runtime import() ภายใน useEffect (useReactLeaflet hook ด้านล่าง)
// แทนการ import ปกติที่หัวไฟล์ เพราะ react-leaflet แตะ window/document ตอน import
// ถ้า import ตรง ๆ ในไฟล์ "use client" จะพัง SSR ทันที (Next.js ยัง server-render
// client component รอบแรกอยู่ดี) การใช้ import() ใน useEffect ทำให้โค้ดนี้รันเฉพาะ
// ฝั่ง browser เท่านั้น ผลลัพธ์เทียบเท่า next/dynamic({ ssr: false }) แต่ไม่ต้องแยกไฟล์
//
// ต้องติดตั้ง: npm install react-leaflet leaflet && npm install -D @types/leaflet
// และต้อง import "leaflet/dist/leaflet.css" ใน app/layout.tsx (root layout)

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// โหลด react-leaflet เฉพาะฝั่ง client เท่านั้น (module นี้แตะ window ตอน import)
function useReactLeaflet() {
  const [RL, setRL] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import("react-leaflet").then((mod) => { if (mounted) setRL(mod); });
    return () => { mounted = false; };
  }, []);
  return RL;
}

const COLOR = {
  primary: "#FFD100", dark: "#3F4444", green: "#00875A", amber: "#E67E00",
  red: "#D32F2F", purple: "#6B4EAD", blue: "#3b82f6", gray: "#64748B", mid: "#A7A8AA",
  border: "#E8EAEC", text: "#1A1C1E", muted: "#6B6E72",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#eab308", IN_PROGRESS: "#3b82f6", PAUSED: "#6b7280",
  REJECTED: "#f87171", RESOLVED: "#22c55e", CLOSED: "#8b5cf6",
};
function slaColor(pct: number) {
  if (pct >= 90) return COLOR.green;
  if (pct >= 75) return COLOR.amber;
  return COLOR.red;
}
function daysAgo(base: string, n: number) {
  const d = new Date(base); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}
function buildDatePresets(today: string) {
  return [
    { l: "7 วันล่าสุด", s: daysAgo(today, 6), e: today },
    { l: "เดือนนี้", s: today.slice(0, 7) + "-01", e: today },
    { l: "ปีนี้", s: today.slice(0, 4) + "-01-01", e: today },
    { l: "ทั้งหมด", s: "2024-01-01", e: today },
  ];
}

function useApi<T = any>(endpoint: string | null, params: Record<string, any> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!endpoint);
  const fetchData = useCallback(async () => {
    if (!endpoint) { setLoading(false); return; }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
      const url = qs.toString() ? `${endpoint}?${qs}` : endpoint;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch { setData(null); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);
  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
function CardTitle({ children, sub, right }: { children: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <div className="flex items-center gap-2 font-bold text-[15px] text-[#1A1C1E]">
          <span className="inline-block h-4 w-1 rounded bg-[#FFD100]" />
          {children}
        </div>
        {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function Skeleton({ height = 190 }: { height?: number }) {
  return <div className="animate-pulse rounded-xl bg-gray-100" style={{ height }} />;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">{children}</div>;
}
function ErrorBanner({ message = "โหลดข้อมูลไม่สำเร็จ" }: { message?: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><span>⚠️</span>{message}</div>;
}
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-block cursor-help text-gray-400" tabIndex={0}>
      ⓘ
      <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-2.5 text-xs leading-relaxed text-white group-hover:block group-focus:block">{text}</span>
    </span>
  );
}
function Badge({ label, color = COLOR.gray }: { label?: string; color?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: color + "22", color, border: `1px solid ${color}40` }}>
      {label || "—"}
    </span>
  );
}
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-5" onClick={onClose}>
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="ปิด" className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        {children}
      </div>
    </div>
  );
}
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold">{label || "—"}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value?.toLocaleString?.() ?? p.value}</b></div>)}
    </div>
  );
};
function ChartLegend({ items }: { items: [string, string][] }) {
  return (
    <div className="mb-2 flex gap-4 text-xs text-gray-500">
      {items.map(([label, color]) => (
        <span key={label} className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>
      ))}
    </div>
  );
}
function DeltaPill({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) return null;
  const isFlat = delta === 0; const isUp = delta > 0;
  const color = isFlat ? COLOR.gray : isUp ? COLOR.green : COLOR.red;
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: color + "18", color }}>{isFlat ? "‒" : isUp ? "↗" : "↘"} {Math.abs(delta).toFixed(1)} จุด</span>;
}
function SLABar({ name, pct, estimate = false }: { name: string; pct: number; estimate?: boolean }) {
  const col = estimate ? COLOR.mid : slaColor(pct);
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">{name}{estimate && <span className="text-[10px] text-gray-400">(ประมาณการ)</span>}</span>
        <span className="font-semibold" style={{ color: col }}>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
      </div>
    </div>
  );
}

// ── แผนที่รายพื้นที่ (react-leaflet, โหลดผ่าน useReactLeaflet) ────────────
type Area = {
  district: string;
  total: number;
  open: number;
  done: number;
  sla_breach: number;
  closure_rate: number;
  lat: number | null;
  lng: number | null;
};
const AREA_METRICS = [
  { id: "closure_rate", label: "อัตราการปิดงาน", direction: "good" as const, fmt: (v: number) => v + "%" },
  { id: "sla_breach", label: "งานเกินกำหนด SLA", direction: "bad" as const, fmt: (v: number) => (v || 0).toLocaleString() },
  { id: "open", label: "ค้างดำเนินการ", direction: "bad" as const, fmt: (v: number) => (v || 0).toLocaleString() },
  { id: "total", label: "ปริมาณรวม", direction: "neutral" as const, fmt: (v: number) => (v || 0).toLocaleString() },
];
function lerpHex(hex1: string, hex2: string, t: number) {
  const p = (s: string) => parseInt(s, 16);
  const h = (hex: string) => [p(hex.slice(1, 3)), p(hex.slice(3, 5)), p(hex.slice(5, 7))];
  const [r1, g1, b1] = h(hex1), [r2, g2, b2] = h(hex2);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
function heatColor(val: number, min: number, max: number, direction: string) {
  if (max === min) return COLOR.green;
  const t = (val - min) / (max - min);
  if (direction === "good") return lerpHex("#FDECEA", "#00875A", t);
  if (direction === "bad") return lerpHex("#E8F5E9", "#D32F2F", t);
  return lerpHex("#EFF1F3", "#3F4444", t);
}
function ratingLabel(pct: number) {
  if (pct >= 90) return "ดีเยี่ยม";
  if (pct >= 75) return "ดี";
  return "ควรปรับปรุง";
}

function AreaMap({ areas }: { areas: Area[] }) {
  const RL = useReactLeaflet();
  const [metric, setMetric] = useState<string>("closure_rate");
  const [selected, setSelected] = useState<string>("");

  const geoAreas = useMemo(() => areas.filter((a) => a.lat != null && a.lng != null), [areas]);
  const m = AREA_METRICS.find((x) => x.id === metric)!;
  const vals = areas.map((a) => Number((a as any)[metric]) || 0);
  const minV = Math.min(...vals), maxV = Math.max(...vals);

  const center: [number, number] = geoAreas.length
    ? [
        geoAreas.reduce((s, a) => s + a.lat!, 0) / geoAreas.length,
        geoAreas.reduce((s, a) => s + a.lng!, 0) / geoAreas.length,
      ]
    : [13.7563, 100.5018];

  const totals = areas.reduce(
    (acc, a) => ({
      total: acc.total + (Number(a.total) || 0),
      open: acc.open + (Number(a.open) || 0),
      done: acc.done + (Number(a.done) || 0),
      sla_breach: acc.sla_breach + (Number(a.sla_breach) || 0),
    }),
    { total: 0, open: 0, done: 0, sla_breach: 0 }
  );
  const overviewClosure = totals.total > 0 ? Math.round((totals.done / totals.total) * 1000) / 10 : 0;
  const overviewOpenPct = totals.total > 0 ? Math.round((totals.open / totals.total) * 100) : 0;
  const overviewBreachPct = totals.total > 0 ? Math.round((totals.sla_breach / totals.total) * 100) : 0;

  const selectedArea = selected ? areas.find((a) => a.district === selected) : null;

  const radiusFor = (val: number) => {
    if (maxV === minV) return 14;
    const t = (val - minV) / (maxV - minV);
    return 10 + t * 18;
  };

  const panelDistrict = selectedArea?.district || "ทุกพื้นที่ (ภาพรวม)";
  const panelClosure = selectedArea ? selectedArea.closure_rate : overviewClosure;
  const panelTotal = selectedArea ? selectedArea.total : totals.total;
  const panelOpen = selectedArea ? selectedArea.open : totals.open;
  const panelBreach = selectedArea ? selectedArea.sla_breach : totals.sla_breach;
  const panelDone = selectedArea ? selectedArea.done : totals.done;
  const panelOpenPct = selectedArea && selectedArea.total > 0 ? Math.round((selectedArea.open / selectedArea.total) * 100) : overviewOpenPct;
  const panelBreachPct = selectedArea && selectedArea.total > 0 ? Math.round((selectedArea.sla_breach / selectedArea.total) * 100) : overviewBreachPct;
  const doneShare = panelTotal > 0 ? (panelDone / panelTotal) * 100 : 0;
  const openShare = panelTotal > 0 ? (panelOpen / panelTotal) * 100 : 0;
  const breachShare = panelTotal > 0 ? (panelBreach / panelTotal) * 100 : 0;

  if (!RL) return <Skeleton height={420} />;
  const { MapContainer, TileLayer, CircleMarker, Tooltip: LeafletTooltip } = RL;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {AREA_METRICS.map((mx) => (
            <button
              key={mx.id}
              onClick={() => setMetric(mx.id)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={
                metric === mx.id
                  ? { background: COLOR.primary + "30", borderColor: COLOR.primary }
                  : { borderColor: COLOR.border, color: COLOR.muted }
              }
            >
              {mx.label}
            </button>
          ))}
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 focus:border-[#FFD100] focus:outline-none"
        >
          <option value="">📍 ทุกพื้นที่ (ภาพรวม)</option>
          {areas.map((a) => (
            <option key={a.district} value={a.district}>
              {a.district}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 420 }}>
          <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {geoAreas.map((a) => {
              const val = Number((a as any)[metric]) || 0;
              const col = heatColor(val, minV, maxV, m.direction);
              const isSelected = selected === a.district;
              return (
                <CircleMarker
                  key={a.district}
                  center={[a.lat!, a.lng!]}
                  radius={radiusFor(val)}
                  pathOptions={{
                    fillColor: col,
                    color: isSelected ? COLOR.primary : "#fff",
                    weight: isSelected ? 3 : 2,
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{ click: () => setSelected(a.district === selected ? "" : a.district) }}
                >
                  <LeafletTooltip direction="top">
                    <div className="text-xs font-semibold">
                      {a.district}: {m.fmt(val)}
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Panel สรุปด้านขวา */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            🗺️ {selectedArea ? "ภาพรวมเขต" : "ภาพรวมทุกพื้นที่"}
          </div>
          <div className="mb-3 text-base font-bold text-[#1A1C1E]">{panelDistrict}</div>

          <div className="mb-4">
            <div className="text-3xl font-extrabold" style={{ color: slaColor(panelClosure) }}>
              {panelClosure}%
            </div>
            <div className="text-sm font-semibold" style={{ color: slaColor(panelClosure) }}>
              {ratingLabel(panelClosure)}
            </div>
            <div className="text-xs text-gray-400">อัตราการปิดงาน เฉลี่ย</div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white p-2.5">
              <div className="font-bold text-[#1A1C1E]">{panelTotal.toLocaleString()}</div>
              <div className="text-gray-400">ปริมาณรวม</div>
            </div>
            <div className="rounded-lg bg-white p-2.5">
              <div className="font-bold" style={{ color: COLOR.amber }}>
                {panelOpen.toLocaleString()}
              </div>
              <div className="text-gray-400">ค้างดำเนินการ ({panelOpenPct}%)</div>
            </div>
            <div className="rounded-lg bg-white p-2.5">
              <div className="font-bold" style={{ color: COLOR.red }}>
                {panelBreach.toLocaleString()}
              </div>
              <div className="text-gray-400">งานเกินกำหนด SLA ({panelBreachPct}%)</div>
            </div>
            <div className="rounded-lg bg-white p-2.5">
              <div className="font-bold" style={{ color: COLOR.green }}>
                {panelDone.toLocaleString()}
              </div>
              <div className="text-gray-400">ดำเนินการเสร็จสิ้น</div>
            </div>
          </div>

          <div className="mb-1.5 flex h-2.5 overflow-hidden rounded-full">
            <div style={{ width: `${doneShare}%`, background: COLOR.green }} />
            <div style={{ width: `${openShare}%`, background: COLOR.amber }} />
            <div style={{ width: `${breachShare}%`, background: COLOR.red }} />
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.green }} />เสร็จสิ้น</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.amber }} />ค้างดำเนินการ</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLOR.red }} />งานเกินกำหนด SLA</span>
          </div>

          {!selectedArea && (
            <div className="mt-3 text-[11px] text-gray-400">ⓘ เลือกเขตจากเมนูด้านบน หรือคลิกจุดบนแผนที่เพื่อดูรายละเอียดเฉพาะพื้นที่</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>น้อย</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background:
              m.direction === "good"
                ? `linear-gradient(to right, #FDECEA, ${COLOR.green})`
                : m.direction === "bad"
                ? `linear-gradient(to right, #E8F5E9, ${COLOR.red})`
                : `linear-gradient(to right, #EFF1F3, #3F4444)`,
          }}
        />
        <span>มาก</span>
        <span className="ml-2 whitespace-nowrap">
          {minV.toLocaleString()} – {maxV.toLocaleString()}
          {metric === "closure_rate" ? "%" : ""}
        </span>
      </div>
    </div>
  );
}

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const RL = useReactLeaflet();
  if (!RL) return <Skeleton height={200} />;
  const { MapContainer, TileLayer, CircleMarker } = RL;
  return (
    <div className="mt-1 overflow-hidden rounded-xl border border-gray-200" style={{ height: 200 }}>
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={9}
          pathOptions={{ fillColor: "#FFD100", color: "#fff", weight: 2, fillOpacity: 1 }}
        />
      </MapContainer>
    </div>
  );
}

// ── กราฟแนวโน้ม SLA: On-time vs Breach (ผูกกับตัวกรองวันที่หลักของหน้า) ──
function SlaTrendChart({ dates }: { dates: { start_date: string; end_date: string } }) {
  const { data, loading } = useApi<any[]>("/api/machine-learning_prediction/risk/sla-trend", dates);
  const rows = Array.isArray(data) ? data : [];
  return (
    <Card>
      <CardTitle sub="เทียบจำนวนเคสที่จบตรง SLA กับเคสที่เกิน SLA ตามช่วงวันที่ที่เลือกไว้ด้านบน">
        แนวโน้ม SLA: On-time vs Breach
      </CardTitle>
      <ChartLegend items={[["ตรงตาม SLA", COLOR.green], ["เกิน SLA", COLOR.red]]} />
      {loading ? <Skeleton height={200} /> : rows.length === 0 ? (
        <Empty>ไม่มีข้อมูลแนวโน้ม SLA ในช่วงที่เลือก</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTip />} />
            <Line type="monotone" dataKey="on_time" name="ตรงตาม SLA" stroke={COLOR.green} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="breached" name="เกิน SLA" stroke={COLOR.red} strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ── Date range bar (เพิ่ม input type="date" ให้เลือกวันที่เองได้ นอกจากปุ่มลัด) ──
function DateRangeBar({ dates, setDates, today }: { dates: { start_date: string; end_date: string }; setDates: (d: any) => void; today: string }) {
  const presets = useMemo(() => buildDatePresets(today), [today]);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm">
      <span className="text-xs font-semibold text-gray-500">📅 ช่วงเวลา:</span>
      {presets.map((d) => {
        const active = dates.start_date === d.s && dates.end_date === d.e;
        return (
          <button
            key={d.l}
            onClick={() => setDates({ start_date: d.s, end_date: d.e })}
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={active ? { background: "#FFD10030", borderColor: "#FFD100", color: "#8a6d00" } : { borderColor: "#E8EAEC", color: "#6B6E72" }}
          >
            {d.l}
          </button>
        );
      })}

      {/* เลือกวันที่เอง (วัน/เดือน/ปี) — ถ้าใส่แล้วไม่ตรงปุ่มลัดไหนเลย ปุ่มลัดด้านบนจะไม่ active ให้อัตโนมัติ */}
      <span className="ml-2 flex items-center gap-1.5 text-xs text-gray-500">
        ตั้งแต่
        <input
          type="date"
          value={dates.start_date}
          max={dates.end_date}
          onChange={(e) => setDates((d: any) => ({ ...d, start_date: e.target.value }))}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-[#FFD100] focus:outline-none"
        />
        ถึง
        <input
          type="date"
          value={dates.end_date}
          min={dates.start_date}
          max={today}
          onChange={(e) => setDates((d: any) => ({ ...d, end_date: e.target.value }))}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-[#FFD100] focus:outline-none"
        />
      </span>
    </div>
  );
}

// ── หน้าหลัก ─────────────────────────────────────────────────
export default function SlaDashboardPage() {
  // ใช้วันเวลาปัจจุบันจริงของเครื่องผู้ใช้เสมอ (ไม่ล็อกตามวันที่ล่าสุดใน DB อีกต่อไป —
  // เหมาะกับการใช้งานจริง ต่อให้ไม่มี complaint ใหม่เข้ามาหลายวัน ช่วง "วันนี้/เดือนนี้" ก็ยังขยับตามเวลาจริง)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dates, setDates] = useState<{ start_date: string; end_date: string }>(() => ({
    start_date: daysAgo(today, 6), // ค่าเริ่มต้น = 7 วันล่าสุดนับจากวันนี้จริง
    end_date: today,
  }));

  const { data: cats, loading: cl } = useApi<any[]>(dates ? "/api/by-category" : null, dates || {});
  const { data: areas, loading: al } = useApi<any[]>(dates ? "/api/by-area" : null, dates || {});
  const { data: wf, loading: wl } = useApi<any[]>(dates ? "/api/workflow" : null, dates || {});
  const { data: sla, loading: sl } = useApi<any>(dates ? "/api/sla" : null, dates || {});

  const RECENT_PAGE_SIZE = 10;
  const [recentPage, setRecentPage] = useState(0);
  const [recentSearchInput, setRecentSearchInput] = useState("");
  const [recentSearch, setRecentSearch] = useState("");
  useEffect(() => { const t = setTimeout(() => setRecentSearch(recentSearchInput), 400); return () => clearTimeout(t); }, [recentSearchInput]);
  useEffect(() => { setRecentPage(0); }, [dates?.start_date, dates?.end_date, recentSearch]);
  const [recentDetail, setRecentDetail] = useState<any>(null);
  const { data: recentRes, loading: rl } = useApi<any>(dates ? "/api/recent" : null, {
    ...(dates || {}), limit: RECENT_PAGE_SIZE, offset: recentPage * RECENT_PAGE_SIZE, search: recentSearch || undefined,
  });

  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const safeCats = Array.isArray(cats) ? cats.map((c) => ({ ...c, name: c.name || "ไม่ระบุ" })) : [];
  const safeAreas = Array.isArray(areas) ? areas : [];
  const safeWf = Array.isArray(wf) ? wf : [];
  const safeRecent = Array.isArray(recentRes?.items) ? recentRes.items : [];
  const recentTotal = recentRes?.total || 0;
  const recentPages = Math.max(Math.ceil(recentTotal / RECENT_PAGE_SIZE), 1);
  const safeCatSLA = sla && Array.isArray(sla.by_category) ? sla.by_category : safeCats;
  const safeSubSLA = sla && Array.isArray(sla.by_subcategory) ? sla.by_subcategory : [];
  const wfColors = [COLOR.primary, COLOR.dark, COLOR.green, COLOR.amber, COLOR.mid, COLOR.purple, COLOR.red];

  return (
    <div className="flex flex-col gap-5 p-6">
      <DateRangeBar dates={dates} setDates={setDates} today={today} />

      {/* Row 1: Workflow Funnel + Stacked Bar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardTitle sub="จำนวน action ต่อขั้นตอน">กระบวนการทำงานตามลำดับขั้น</CardTitle>
          {wl ? <Skeleton height={200} /> : (
            <div className="space-y-2.5">
              {safeWf.map((w, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-gray-500">{w.label}</span><span className="font-semibold">{w.count?.toLocaleString()}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${(w.count / (safeWf[0]?.count || 1)) * 100}%`, background: wfColors[i % wfColors.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle sub="แก้ไขแล้ว vs ค้างอยู่ แยกตามหมวดหมู่">ปริมาณเรื่องตามหมวดหมู่</CardTitle>
          <ChartLegend items={[["แก้ไขแล้ว", COLOR.green], ["ค้างอยู่", COLOR.amber]]} />
          {cl ? <Skeleton height={210} /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={safeCats}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => (v?.length > 9 ? v.slice(0, 9) + "…" : v || "ไม่ระบุ")} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="done" name="แก้ไขแล้ว" stackId="a" fill={COLOR.green} />
                <Bar dataKey="open" name="ค้างอยู่" stackId="a" fill={COLOR.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 2: แนวโน้ม SLA (On-time vs Breach) + SLA by Category */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SlaTrendChart dates={dates} />

        <Card>
          <CardTitle sub="% SLA สำเร็จ แยกตามหมวดหมู่ · คลิกชื่อหมวดหมู่เพื่อดูประเภทย่อย">SLA ตามหมวดหมู่</CardTitle>
          {cl || sl ? <Skeleton height={180} /> : safeCatSLA.map((c: any, i: number) => {
            const isOpen = expandedCat === c.name;
            const subs = safeSubSLA.filter((s: any) => s.category === c.name);
            return (
              <div key={i}>
                <div onClick={() => subs.length > 0 && setExpandedCat(isOpen ? null : c.name)} className={subs.length > 0 ? "cursor-pointer" : ""}>
                  <SLABar name={(subs.length > 0 ? (isOpen ? "▾ " : "▸ ") : "") + c.name} pct={c.sla_pct ?? (c.total > 0 ? Math.round((c.done / c.total) * 100) : 0)} estimate={c.sla_pct == null} />
                </div>
                {isOpen && (
                  <div className="ml-4 mb-2 border-l-2 border-gray-100 pl-4">
                    {subs.map((s: any, j: number) => <SLABar key={j} name={s.subcategory} pct={s.sla_pct} />)}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </div>

      {/* Row 3: แผนที่รายพื้นที่ */}
      <Card>
        <CardTitle sub="เลือกตัวชี้วัดหรือเขตเพื่อดูรายละเอียด · คลิกจุดบนแผนที่ได้เช่นกัน">SLA และสถานะรายพื้นที่</CardTitle>
        {al ? (
          <Skeleton height={420} />
        ) : safeAreas.length === 0 ? (
          <Empty>ไม่มีข้อมูลรายพื้นที่</Empty>
        ) : (
          <AreaMap areas={safeAreas} />
        )}
      </Card>

      {/* Row 4: รายการเรื่องร้องเรียนล่าสุด */}
      <Card>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <CardTitle sub={`ทั้งหมด ${recentTotal.toLocaleString()} เรื่อง (ตามช่วงวันที่ที่เลือกไว้) · คลิกแถวเพื่อดูรายละเอียด`}>รายการเรื่องร้องเรียน</CardTitle>
          <input
            type="text" placeholder="ค้นหาเลขที่ / เขต / รายละเอียด" value={recentSearchInput}
            onChange={(e) => setRecentSearchInput(e.target.value)}
            className="max-w-[280px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#FFD100] focus:outline-none"
          />
        </div>

        {rl ? <Skeleton height={260} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    {["เลขที่", "วันที่", "เขต", "หมวด", "รายละเอียด", "สถานะ", "Priority"].map((h) => <th key={h} className="py-2">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {safeRecent.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-gray-400">ไม่พบเรื่องร้องเรียนที่ตรงกับเงื่อนไข</td></tr>
                  ) : safeRecent.map((r: any, i: number) => (
                    <tr key={i} onClick={() => setRecentDetail(r)} className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 font-mono font-semibold">{r.no}</td>
                      <td className="py-2.5 whitespace-nowrap">{r.created_at ? r.created_at.slice(0, 10) : "—"}</td>
                      <td className="py-2.5">{r.district}</td>
                      <td className="py-2.5"><Badge label={r.category} color={r.cat_color || COLOR.gray} /></td>
                      <td className="max-w-[240px] truncate py-2.5">{r.detail}</td>
                      <td className="py-2.5"><Badge label={r.status} color={STATUS_COLORS[r.status_code] || COLOR.gray} /></td>
                      <td className="py-2.5"><Badge label={r.priority} color={r.priority_color || COLOR.gray} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recentTotal > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>หน้า {recentPage + 1} / {recentPages} · แสดง {safeRecent.length} จาก {recentTotal.toLocaleString()} เรื่อง</span>
                <div className="flex gap-2">
                  <button disabled={recentPage === 0} onClick={() => setRecentPage((p) => Math.max(p - 1, 0))}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold disabled:opacity-40">‹ ก่อนหน้า</button>
                  <button disabled={recentPage >= recentPages - 1} onClick={() => setRecentPage((p) => Math.min(p + 1, recentPages - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold disabled:opacity-40">ถัดไป ›</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {recentDetail && (
        <Modal onClose={() => setRecentDetail(null)}>
          <div className="p-6">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="font-mono text-base font-bold">{recentDetail.no}</span>
              <Badge label={recentDetail.status} color={STATUS_COLORS[recentDetail.status_code] || COLOR.gray} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-gray-400">เขต</span><div>{recentDetail.district || "—"}</div></div>
              <div><span className="text-xs text-gray-400">วันที่เปิดเรื่อง</span><div>{recentDetail.created_at ? recentDetail.created_at.slice(0, 10) : "—"}</div></div>
              <div><span className="text-xs text-gray-400">ประเภทย่อย</span><div>{recentDetail.subcategory || recentDetail.category}</div></div>
              <div><span className="text-xs text-gray-400">ทีมที่รับผิดชอบ</span><div>{recentDetail.team_name || "ยังไม่มอบหมาย"}</div></div>
            </div>
            {recentDetail.location_text && (
              <div className="mt-3.5"><span className="text-xs text-gray-400">ที่อยู่ / จุดสังเกต</span><div className="mt-1 text-sm">{recentDetail.location_text}</div></div>
            )}
            <div className="mt-3.5"><span className="text-xs text-gray-400">รายละเอียด</span><div className="mt-1 text-sm leading-relaxed">{recentDetail.detail || "ไม่มีรายละเอียดเพิ่มเติม"}</div></div>
            {recentDetail.lat != null && recentDetail.lng != null && (
              <div className="mt-3.5">
                <span className="text-xs text-gray-400">ตำแหน่งบนแผนที่</span>
                <MiniMap lat={Number(recentDetail.lat)} lng={Number(recentDetail.lng)} />
                <a href={`https://www.google.com/maps?q=${recentDetail.lat},${recentDetail.lng}`} target="_blank" rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">
                  เปิดใน Google Maps ↗
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}