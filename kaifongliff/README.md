# 🏘️ KaiFong AI — LIFF App

> แอปเว็บ LINE LIFF สำหรับ **แจ้งเรื่องร้องเรียน** และ **ติดตามสถานะเรื่องร้องเรียน** ของประชาชน  
> พัฒนาด้วย Next.js 16 + React 19 + TypeScript

---

## 📑 สารบัญ

- [ภาพรวมโปรเจกต์](#-ภาพรวมโปรเจกต์)
- [Tech Stack](#-tech-stack)
- [โครงสร้างโฟลเดอร์](#-โครงสร้างโฟลเดอร์)
- [เริ่มต้นใช้งาน (Getting Started)](#-เริ่มต้นใช้งาน-getting-started)
- [Environment Variables](#-environment-variables)
- [User Flow — ขั้นตอนการใช้งาน](#-user-flow--ขั้นตอนการใช้งาน)
  - [Flow 1: แจ้งเรื่องร้องเรียน](#flow-1-แจ้งเรื่องร้องเรียน-submit-complaint)
  - [Flow 2: ติดตามเรื่องร้องเรียน](#flow-2-ติดตามเรื่องร้องเรียน-track-complaint)
- [API Routes](#-api-routes)
- [Components](#-components)
- [State Management](#-state-management)
- [LIFF Integration](#-liff-integration)
- [Google Maps Integration](#-google-maps-integration)
- [ข้อมูล Mock Data](#-ข้อมูล-mock-data)

---

## 🏗 ภาพรวมโปรเจกต์

KaiFong AI คือ LIFF App (LINE Front-end Framework) ที่เปิดให้ประชาชน:

1. **แจ้งเรื่องร้องเรียน** — กรอกข้อมูลส่วนตัว → กรอกรายละเอียดเรื่องร้องเรียน + ปักหมุดแผนที่ + แนบรูป → ส่งเรื่อง
2. **ติดตามสถานะ** — ดูรายการเรื่องที่เคยแจ้ง → ดูรายละเอียดแต่ละเรื่อง → ให้คะแนนเมื่อเสร็จสิ้น

แอปนี้ทำงานภายใน LINE App ผ่าน LIFF เท่านั้น (จะดึง profile ผู้ใช้จาก LINE โดยอัตโนมัติ)

---

## 🛠 Tech Stack

| เทคโนโลยี | เวอร์ชัน | ใช้ทำอะไร |
|---|---|---|
| **Next.js** | 16.2.6 | Framework หลัก (App Router) |
| **React** | 19.2.4 | UI Library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.3 | Styling |
| **@line/liff** | 2.28.0 | เชื่อมต่อ LINE LIFF |
| **Zustand** | 5.x | State management (จัดการรูปภาพ) |
| **iron-session** | 8.x | Server-side session (เก็บข้อมูลฟอร์ม) |
| **@vercel/blob** | 2.x | อัปโหลดรูปภาพ |
| **Google Maps API** | — | แผนที่ + ค้นหาสถานที่ |
| **Lucide React** | 1.x | ไอคอน |

---

## 📂 โครงสร้างโฟลเดอร์

```
KaifongLIFF/
├── app/                          # 📄 Pages & API Routes (App Router)
│   ├── page.tsx                  #   → หน้าแรก (redirect ไป /userform/Reporter_Info)
│   ├── layout.tsx                #   → Root Layout (โหลด LIFF + Google Maps)
│   ├── globals.css               #   → Global styles
│   │
│   ├── userform/                 #   → ฟอร์มแจ้งเรื่องร้องเรียน
│   │   ├── Reporter_Info/        #     Step 1: ข้อมูลผู้แจ้ง
│   │   ├── Complaint_Details/    #     Step 2: รายละเอียดเรื่อง + แผนที่ + รูป
│   │   └── details/              #     Step 3: สรุปข้อมูลก่อนส่ง
│   │
│   ├── track-complaint/          #   → ติดตามเรื่องร้องเรียน
│   │   ├── page.tsx              #     รายการเรื่องร้องเรียนทั้งหมด
│   │   ├── complaint/[id]/       #     ดูรายละเอียด + สถานะ
│   │   └── details/[id]/         #     ดูข้อมูลเรื่องร้องเรียน (Evidence)
│   │
│   └── api/                      #   → Backend API Routes
│       ├── complaint/            #     POST — ส่งเรื่องร้องเรียน + อัปโหลดรูป
│       ├── form/                 #     POST — บันทึกข้อมูลผู้แจ้งลง session
│       ├── static-map/           #     GET  — Proxy รูป Google Static Map
│       ├── upload/               #     GET  — สร้าง upload token (Vercel Blob)
│       └── user/                 #     GET  — ดึงข้อมูลผู้ใช้จาก session
│
├── components/                   # 🧩 Reusable Components
│   ├── navbar.tsx                #   → Navbar ด้านบน
│   ├── Map.tsx                   #   → แผนที่ Google Maps (interactive)
│   ├── ComplaintDetailsCard.tsx   #   → การ์ดแสดงรายละเอียดเรื่องร้องเรียน
│   ├── Pagination.tsx            #   → ปุ่มเลื่อนหน้า
│   │
│   ├── userform/                 #   → Components สำหรับฟอร์มแจ้งเรื่อง
│   │   ├── card_form.tsx         #     ฟอร์ม Step 1 (ข้อมูลส่วนตัว)
│   │   ├── card_form2.tsx        #     ฟอร์ม Step 2 (รายละเอียด + แผนที่ + รูป)
│   │   ├── card_pdpa.tsx         #     Checkbox ยินยอม PDPA
│   │   ├── UserCard.tsx          #     แสดง profile LINE ของผู้ใช้
│   │   ├── EvidenceCard.tsx      #     แสดงสรุปเรื่องร้องเรียนที่ส่งแล้ว
│   │   ├── dropdown.tsx          #     Dropdown ทั่วไป (มี search)
│   │   ├── serchabledropdown.tsx #     Dropdown ค้นหาได้ (หมวดหมู่เรื่อง)
│   │   ├── serchbar.tsx          #     Search bar สำหรับค้นหาสถานที่
│   │   ├── staticMap.tsx         #     แสดงรูป Static Map
│   │   └── step_progress_*.tsx   #     ตัวแสดง Progress ของแต่ละ Step
│   │
│   └── complaint/                #   → Components สำหรับติดตามเรื่อง
│       ├── Header.tsx            #     Header + ปุ่มกลับ
│       ├── SearchBar.tsx         #     ค้นหาเรื่องร้องเรียน
│       ├── StatusTabs.tsx        #     แท็บกรองตามสถานะ
│       ├── RequestCard.tsx       #     การ์ดแสดงรายการเรื่อง
│       ├── StatusCard.tsx        #     การ์ดแสดงสถานะ + progress
│       ├── ProgressSteps.tsx     #     Timeline สถานะ
│       └── RatingModal.tsx       #     Modal ให้คะแนน (ดาว)
│
├── providers/                    # 🔌 Context Providers
│   └── liff-providers.tsx        #   → LIFF Context (init + ให้ liff object)
│
├── hooks/                        # 🪝 Custom Hooks
│   └── usePhotoStore.ts          #   → Zustand store จัดการรูปภาพ
│
├── lib/                          # 📚 Utilities & Data Logic
│   ├── session.ts                #   → ดึง user ID ปัจจุบัน
│   └── mockDB/                   #   → Mock database logic
│       ├── requests.types.ts     #     TypeScript interfaces ทั้งหมด
│       ├── caseUtils.ts          #     สร้างเลขเรื่อง, ดึงข้อมูลเรื่อง
│       └── status.ts             #     Mapping สถานะ → สี, %, label
│
└── data/                         # 📊 Static Data
    ├── mock_data_may2026.json    #   → ข้อมูล mock (หมวดหมู่ + เรื่องตัวอย่าง)
    └── prefix.ts                 #   → คำนำหน้าชื่อ 200+ รายการ
```

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้างไฟล์ `.env.local`

```env
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-maps-api-key
GOOGLE_API_KEY=your-google-maps-api-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

> ดูรายละเอียด Environment Variables ด้านล่าง

### 3. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

> ⚠️ **หมายเหตุ:** แอปออกแบบมาเพื่อรันภายใน LINE LIFF เท่านั้น  
> หากเปิดในเบราว์เซอร์ปกติ LIFF จะไม่สามารถดึง profile ได้

### 4. Build สำหรับ Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

| ตัวแปร | จำเป็น | คำอธิบาย |
|---|:---:|---|
| `NEXT_PUBLIC_LIFF_ID` | ✅ | LIFF ID จาก [LINE Developers Console](https://developers.line.biz/) |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | ✅ | Google Maps API Key (ใช้ฝั่ง client — Maps JavaScript API) |
| `GOOGLE_API_KEY` | ✅ | Google Maps API Key (ใช้ฝั่ง server — Static Maps API) |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Token สำหรับ Vercel Blob Storage (อัปโหลดรูปภาพ) |

### วิธีขอ API Key

1. **LIFF ID** — สร้าง LIFF App ที่ [LINE Developers Console](https://developers.line.biz/) → เลือก Provider → Channel → LIFF
2. **Google Maps API Key** — เปิดใช้ Maps JavaScript API + Static Maps API + Places API ที่ [Google Cloud Console](https://console.cloud.google.com/)
3. **Vercel Blob Token** — สร้าง Blob Store ที่ [Vercel Dashboard](https://vercel.com/dashboard) → Storage → Create → Blob

---

## 🔄 User Flow — ขั้นตอนการใช้งาน

### Flow 1: แจ้งเรื่องร้องเรียน (Submit Complaint)

```
ผู้ใช้เปิดแอปผ่าน LINE
        │
        ▼
┌─────────────────────────────┐
│  Step 1: ข้อมูลผู้แจ้ง       │  /userform/Reporter_Info
│  ─────────────────────────  │
│  • แสดง profile LINE        │
│  • กรอก คำนำหน้า            │
│  • กรอก ชื่อ-นามสกุล         │
│  • กรอก เบอร์โทร             │
│  • กรอก เลขบัตรประชาชน       │
│  • กด [ถัดไป]               │
└─────────────┬───────────────┘
              │  POST /api/form (บันทึกลง session)
              ▼
┌─────────────────────────────┐
│  Step 2: รายละเอียดเรื่อง    │  /userform/Complaint_Details
│  ─────────────────────────  │
│  • เลือก หมวดหมู่เรื่อง      │
│  • กรอก รายละเอียด           │
│  • ปักหมุด บนแผนที่          │
│  • กรอก/เลือก ที่อยู่        │
│  • ถ่ายรูป / เลือกรูป        │
│  • ยินยอม PDPA              │
│  • กด [ส่งเรื่อง]           │
└─────────────┬───────────────┘
              │  POST /api/complaint (ส่งข้อมูล + อัปโหลดรูป)
              ▼
┌─────────────────────────────┐
│  Step 3: ยืนยันสำเร็จ       │  /userform/details
│  ─────────────────────────  │
│  • แสดง เลขที่เรื่อง         │
│  • แสดง สรุปข้อมูลทั้งหมด    │
│  • กด [แจ้งเรื่องใหม่]       │
└─────────────────────────────┘
```

### Flow 2: ติดตามเรื่องร้องเรียน (Track Complaint)

```
ผู้ใช้เปิดหน้าติดตาม
        │
        ▼
┌─────────────────────────────┐
│  รายการเรื่องร้องเรียน       │  /track-complaint
│  ─────────────────────────  │
│  • ค้นหาเรื่อง               │
│  • กรองตามสถานะ (แท็บ)       │
│    - ทั้งหมด                 │
│    - รอดำเนินการ             │
│    - กำลังดำเนินการ          │
│    - เสร็จสิ้น               │
│  • แสดงรายการ (5 ต่อหน้า)    │
│  • กดเลือกเรื่อง             │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  รายละเอียดเรื่อง           │  /track-complaint/complaint/[id]
│  ─────────────────────────  │
│  • สถานะปัจจุบัน + Progress  │
│  • Timeline ขั้นตอน          │
│  • รายละเอียดเรื่อง          │
│  • แผนที่ตำแหน่ง             │
│  • ปุ่ม [ให้คะแนน] (ถ้าเสร็จ)│
└─────────────┬───────────────┘
              ▼ (ถ้าเสร็จสิ้น)
┌─────────────────────────────┐
│  ให้คะแนน (Rating Modal)     │
│  ─────────────────────────  │
│  • ให้ดาว 1-5               │
│  • เขียนความคิดเห็น          │
│  • กด [ส่ง]                 │
└─────────────────────────────┘
```

---

## 📡 API Routes

| Method | Endpoint | คำอธิบาย | Input | Output |
|---|---|---|---|---|
| `POST` | `/api/form` | บันทึกข้อมูลผู้แจ้งลง session | `FormData` (prefix, name, phone, idCard) | `{ success: true }` |
| `POST` | `/api/complaint` | ส่งเรื่องร้องเรียน + อัปโหลดรูปไป Vercel Blob | `FormData` (topic, detail, lat, lng, address, photos[]) | `{ caseNumber, photoUrls }` |
| `GET` | `/api/user` | ดึงข้อมูลผู้ใช้จาก session | — | `{ user: {...} }` |
| `GET` | `/api/upload` | สร้าง client upload token (Vercel Blob) | — | `{ token, url }` |
| `GET` | `/api/static-map` | ดึงรูป Static Map จาก Google (Proxy ซ่อน API Key) | `?lat=...&lng=...&zoom=...&size=...` | รูปภาพ (image/png) |

---

## 🧩 Components

### ฟอร์มแจ้งเรื่อง (`components/userform/`)

| Component | หน้าที่ |
|---|---|
| `card_form.tsx` | ฟอร์ม Step 1 — คำนำหน้า, ชื่อ, นามสกุล, เบอร์โทร, เลขบัตร |
| `card_form2.tsx` | ฟอร์ม Step 2 — หมวดหมู่, รายละเอียด, แผนที่, รูปภาพ, PDPA |
| `card_pdpa.tsx` | Checkbox ยินยอมข้อมูลส่วนบุคคล (PDPA) |
| `UserCard.tsx` | แสดง avatar + ชื่อ + status จาก LINE profile |
| `EvidenceCard.tsx` | แสดงสรุปเรื่องร้องเรียนที่ส่งแล้ว |
| `dropdown.tsx` | Dropdown พร้อม search (คำนำหน้า) |
| `serchabledropdown.tsx` | Dropdown ค้นหาหมวดหมู่เรื่องร้องเรียน |
| `serchbar.tsx` | Search bar ค้นหาสถานที่บนแผนที่ |
| `staticMap.tsx` | แสดงรูป Static Map |
| `step_progress_*.tsx` | ตัวแสดง Step (1/2/3) ของฟอร์ม |

### ติดตามเรื่อง (`components/complaint/`)

| Component | หน้าที่ |
|---|---|
| `Header.tsx` | หัวหน้า + ปุ่มย้อนกลับ |
| `SearchBar.tsx` | ช่องค้นหาเรื่องร้องเรียน |
| `StatusTabs.tsx` | แท็บกรองตามสถานะ (ทั้งหมด / รอ / กำลัง / เสร็จ) |
| `RequestCard.tsx` | การ์ดแสดงเรื่องร้องเรียนในลิสต์ |
| `StatusCard.tsx` | การ์ดแสดงสถานะปัจจุบัน + % ดำเนินการ |
| `ProgressSteps.tsx` | Timeline แสดงลำดับขั้นตอนสถานะ |
| `RatingModal.tsx` | Modal ให้คะแนน 1-5 ดาว + ความคิดเห็น |

### Components กลาง

| Component | หน้าที่ |
|---|---|
| `navbar.tsx` | Navbar ด้านบน (logo + ชื่อ KaiFong AI) |
| `Map.tsx` | แผนที่ Google Maps แบบ interactive — ปักหมุด, ค้นหาสถานที่, reverse geocoding |
| `ComplaintDetailsCard.tsx` | การ์ดแสดงรายละเอียดเรื่องร้องเรียนแบบเต็ม |
| `Pagination.tsx` | ปุ่มเลื่อนหน้า (แสดง 5 เรื่องต่อหน้า) |

---

## 🗄 State Management

แอปใช้ **3 วิธี** ในการจัดการ state:

| วิธี | ใช้ทำอะไร | ไฟล์ |
|---|---|---|
| **Zustand** | เก็บรูปภาพ (File + preview URL) ข้ามหน้า | `hooks/usePhotoStore.ts` |
| **iron-session** | เก็บข้อมูลผู้แจ้งฝั่ง server (ระหว่าง API calls) | `lib/session.ts` |
| **React useState** | State ภายใน component (ข้อมูลฟอร์ม, UI state) | ทั่วไป |

### Zustand Photo Store

```typescript
// เพิ่มรูป
usePhotoStore.getState().addPhoto(file)

// ลบรูป
usePhotoStore.getState().removePhoto(index)

// เคลียร์ทั้งหมด
usePhotoStore.getState().clearPhotos()

// อ่านค่า
const { photos, photoPreviews } = usePhotoStore()
```

---

## 🔗 LIFF Integration

### LIFF คืออะไร?

**LIFF (LINE Front-end Framework)** คือ framework ที่ทำให้เว็บแอปทำงานภายใน LINE ได้ สามารถ:
- ดึง profile ผู้ใช้ (ชื่อ, รูป, status)
- ส่งข้อความกลับไปในแชท
- แชร์ข้อมูลผ่าน LINE

### การทำงานในแอปนี้

1. **`layout.tsx`** — ครอบทุกหน้าด้วย `<LIFFProvider>`
2. **`liff-providers.tsx`** — Init LIFF SDK ตอนโหลดหน้า → ส่ง `liff` object ผ่าน React Context
3. **`page.tsx`** (หน้าแรก) — อ่าน `liff.state` query param เพื่อ redirect ไปหน้าจริง
4. **Components** — ใช้ `useLIFF()` hook เพื่อดึง profile, ตรวจสอบ login

```typescript
// ใช้ LIFF ใน component
import { useLIFF } from "@/providers/liff-providers";

function MyComponent() {
  const { liff, isLoading, liffError } = useLIFF();

  if (isLoading) return <p>กำลังโหลด...</p>;
  if (liffError) return <p>เกิดข้อผิดพลาด</p>;

  const profile = await liff.getProfile();
  // profile.displayName, profile.pictureUrl, etc.
}
```

---

## 🗺 Google Maps Integration

แอปใช้ Google Maps ใน **2 แบบ**:

### 1. แผนที่แบบ Interactive (`components/Map.tsx`)

- ใช้ **Maps JavaScript API** + **Places API**
- ผู้ใช้สามารถ:
  - ลากหมุดปักตำแหน่ง
  - ค้นหาสถานที่ด้วย autocomplete
  - ดูที่อยู่จาก reverse geocoding
- ส่งค่า `lat`, `lng`, `address` กลับผ่าน callbacks

### 2. แผนที่แบบ Static (`/api/static-map`)

- ใช้ **Static Maps API** ฝั่ง server
- Proxy ผ่าน API route เพื่อ**ซ่อน API Key**
- ใช้แสดงรูปแผนที่ในหน้าสรุป/ติดตาม

---

## 📊 ข้อมูล Mock Data

> ⚠️ ปัจจุบันแอปใช้ **mock data** — ยังไม่ได้เชื่อมฐานข้อมูลจริง

### ไฟล์ข้อมูล

| ไฟล์ | ขนาด | คำอธิบาย |
|---|---|---|
| `data/mock_data_may2026.json` | ~662 KB | ข้อมูลตัวอย่าง — หมวดหมู่, พื้นที่, สถานะ, เรื่องร้องเรียนตัวอย่าง |
| `data/prefix.ts` | ~47 KB | คำนำหน้าชื่อภาษาไทย 200+ รายการ (นาย, นาง, นางสาว, ฯลฯ) |

### Mock DB Utils (`lib/mockDB/`)

| ไฟล์ | หน้าที่ |
|---|---|
| `requests.types.ts` | TypeScript interfaces — `RequestItem`, `CreateComplaintPayload`, etc. |
| `caseUtils.ts` | `generateCaseNumber()` — สร้างเลขที่เรื่อง, `getUserComplaints()` — ดึงเรื่องของ user, `getComplaintById()` — ดึงเรื่องตาม ID |
| `status.ts` | Mapping สถานะ → ชื่อไทย, สี, เปอร์เซ็นต์ (รอดำเนินการ=10%, กำลังดำเนินการ=50%, เสร็จสิ้น=100%) |

---

## 🧪 สิ่งที่ต้องทำต่อ (TODO)

- [ ] เชื่อมฐานข้อมูลจริง (แทน mock data)
- [ ] ระบบ authentication จริง (แทน hardcode user ID)
- [ ] เพิ่ม unit tests
- [ ] เพิ่ม error handling ที่ครอบคลุมขึ้น
- [ ] รองรับ offline mode
