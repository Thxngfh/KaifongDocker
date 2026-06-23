# 🏠 KaifongAI — ระบบจัดการเรื่องร้องเรียน (Back-Office Dashboard)
ระบบ Back-Office สำหรับจัดการเรื่องร้องเรียนและสมาชิก ของเจ้าหน้าที่และผู้บริหาร
พัฒนาด้วย Next.js 16 + React 19 + TypeScript + TailwindCSS 4

---

## 📑 สารบัญ
* [ภาพรวมโปรเจกต์](#-ภาพรวมโปรเจกต์)
* [Tech Stack](#-tech-stack)
* [โครงสร้างโฟลเดอร์](#-โครงสร้างโฟลเดอร์)
* [ระบบ Roles & สิทธิ์การเข้าถึง](#-ระบบ-roles--สิทธิ์การเข้าถึง)
* [เริ่มต้นใช้งาน (Getting Started)](#-เริ่มต้นใช้งาน-getting-started)
* [หน้าเว็บทั้งหมด](#-หน้าเว็บทั้งหมด)
* [Data Flow — ข้อมูลไหลยังไง?](#-data-flow--ข้อมูลไหลยังไง)
* [API Routes](#-api-routes)
* [Services — ชั้น Business Logic](#-services--ชั้น-business-logic)
* [Components](#-components)
* [Design System (สี / ธีม)](#-design-system-สี--ธีม)
* [ข้อมูล Mock Data](#-ข้อมูล-mock-data)
* [สิ่งที่ควรรู้ก่อนแก้โค้ด](#-สิ่งที่ควรรู้ก่อนแก้โค้ด)

---

## 🏗 ภาพรวมโปรเจกต์
KaifongAI เป็นระบบ **Back-Office** สำหรับหน่วยงาน (NT) ที่ใช้จัดการระบบเรื่องร้องทุกข์จากประชาชน:
* **Dashboard** — แสดงสรุปจำนวนเรื่องร้องเรียน (วันนี้ / สัปดาห์ / เดือน), สถานะเรื่องร้องเรียน, เวลาเฉลี่ยการปิดงาน และอันดับปัญหายอดนิยม
* **จัดการสมาชิก** — ตรวจสอบข้อมูลผู้ขอสมัครสมาชิกใหม่ พร้อมปุ่มอนุมัติ (Approved) หรือปฏิเสธ (Rejected)
* **จัดการระดับสิทธิ์** — กำหนดสิทธิ์และบทบาทหน้าที่ (แอดมิน, เจ้าหน้าที่, ผู้ตรวจสอบ) และเปิด/ปิดหรือระงับบัญชีสมาชิก
* **จัดการประเภทปัญหา** — เพิ่ม ลบ แก้ไข และเปิด/ปิดการใช้งานหัวข้อประเภทปัญหาที่เปิดรับเรื่อง
* **ประเมินผลคำร้อง (Director)** — ดูรายละเอียดของเคส ค้นหาประวัติ ดูพิกัดแผนที่ ไฟล์แนบ และประเมินให้คะแนนผ่านอีโมจิ

---

## 🛠 Tech Stack
| เทคโนโลยี | เวอร์ชัน | ใช้ทำอะไร |
|---|---|---|
| **Next.js** | 16.2.2 | Framework หลัก (App Router) |
| **React** | 19.2.4 | UI Library |
| **TypeScript** | 5.x | Type Safety ของภาษา |
| **TailwindCSS** | 4.x | Styling และ Layout |
| **MUI (Material UI)** | 9.x | Component ไอคอนและฟิลด์พิเศษ |
| **React Icons / Heroicons**| — | ไอคอน SVG ในส่วนต่าง ๆ ของระบบ |
| **Emotion** | — | CSS-in-JS (Dependency ของ MUI) |

---

## 📂 โครงสร้างโฟลเดอร์
```
KaifongAI/
├── app/                          # 📄 Pages & API Routes (App Router)
│   ├── page.tsx                  #   → หน้า Login (หน้าแรก)
│   ├── layout.tsx                #   → Root Layout (ฟอนต์ Inter + Noto Sans Thai)
│   ├── globals.css               #   → Global styles (CSS Variables + Design Tokens)
│   ├── adminshell.tsx            #   → Shell Layout ของ Admin (Navbar + Sidebar)
│   ├── directorshell.tsx         #   → Shell Layout ของ Director
│   │
│   ├── admin/                    #   → 👨‍💼 หน้าสำหรับ Admin
│   │   ├── layout.tsx            #     AdminShell Wrapper
│   │   ├── dashboard/            #     แดชบอร์ด Admin
│   │   ├── member-approval/      #     ตารางอนุมัติสมาชิก
│   │   ├── problem-type/         #     จัดการประเภทปัญหา
│   │   ├── permission-management/#     จัดการสิทธิ์สมาชิก
│   │   └── manual/               #     คู่มือการใช้งาน (staff, reporter, user)
│   │
│   ├── director/                 #   → 👔 หน้าสำหรับ Director
│   │   ├── layout.tsx            #     DirectorShell Wrapper
│   │   ├── dashboard/            #     แดชบอร์ด Director
│   │   ├── evaluate/             #     ประเมินเคสคำร้องเรียน (table, detail)
│   │   └── manual/               #     คู่มือการใช้งาน
│   │
│   └── api/                      #   → Backend API Routes
│       ├── summary/              #     GET — สรุปข้อมูล Dashboard
│       ├── table/                #     GET — ตารางเคส (เรียงวันที่)
│       ├── member-approval/      #     จัดการและสรุปสมาชิกที่สมัครเข้ามา
│       ├── permission-management/#     จัดการบทบาทสิทธิ์สมาชิกที่ได้รับอนุมัติ
│       └── problem-type/         #     จัดการประเภทเรื่องร้องทุกข์
│
├── components/ui/                # 🧩 Reusable Components
│   ├── Admin_director/           #   → Components ที่ Admin + Director ใช้ร่วมกัน
│   └── Director/                 #   → Components เฉพาะของฝั่ง Director
│
├── services/                     # ⚙️ Business Logic & Data Access Layer
│   ├── DataProvider.ts           #   → โหลดข้อมูลดิบของเคสร้องเรียน ปัญหา และช่าง
│   └── memberData.ts             #   → จัดการข้อมูลสมาชิก (อ่าน/เขียนไฟล์ JSON)
│
├── lib/                          # 📚 Utilities & Helper Functions
│   └── summaryDashboard.ts       #   → คำนวณสรุปสถิติตัวเลข Dashboard
│
└── data/                         # 📊 ข้อมูลจำลอง (Mock Data JSON)
    ├── member.json               #   → ไฟล์ข้อมูลสมาชิกในระบบ
    └── alternative/              #   → โฟลเดอร์เก็บข้อมูลจำลองชุดใช้งานจริง
        └── data2.json            #     ข้อมูลหลัก (cases, users, technicians, problems, logs)
```

---

## 🔑 ระบบ Roles & สิทธิ์การเข้าถึง
ปัจจุบันระบบรองรับบัญชีล็อกอิน 2 บทบาท โดยมีการเก็บข้อมูลแบบ Hardcoded บนระบบจำลอง:

| บทบาท (Role) | อีเมลล็อกอิน (Email) | รหัสผ่าน (Password) | สิทธิ์เมนูเข้าถึง |
|---|---|---|---|
| **ผู้ดูแลระบบ (Admin)** | `admin@gmail.com` | `admin123` | Dashboard, อนุมัติสมาชิก, จัดการสิทธิ์, ประเภทปัญหา, คู่มือ |
| **ผู้บริหาร (Director)**| `director@gmail.com` | `director123` | Dashboard, ประเมินเคสคำร้องเรียน, คู่มือ |

### ขั้นตอนการ Authentication:
1. ผู้ใช้กรอกข้อมูลล็อกอินที่หน้าหลัก (`app/page.tsx`)
2. ตรวจสอบข้อมูลอีเมลและรหัสผ่านจากตัวแปร Mock
3. หากผ่านการตรวจสอบ ระบบจะเก็บข้อมูล `role` ไว้ใน `localStorage`
4. ทำการเปลี่ยนเส้นทางไปยังหน้าหลักของบทบาทนั้น ๆ เช่น `/admin/dashboard` หรือ `/director/dashboard`

### การป้องกันเส้นทาง (Route Guard):
* ใช้ `AdminShell` และ `DirectorShell` ในการครอบหน้าระบบย่อย
* ระบบจะสแกนหา `localStorage("role")` หากไม่มีข้อมูล หรือบทบาทไม่ตรงกับเส้นทาง จะบังคับให้ Redirect กลับสู่หน้า Login ทันที

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)
### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รัน Development Server
```bash
npm run dev
```
เปิดบราวเซอร์เข้าชมได้ที่ [http://localhost:3000](http://localhost:3000)

### 3. Build สำหรับ Production
```bash
npm run build
npm start
```

---

## 📄 หน้าเว็บทั้งหมด
### หน้าหลัก / ล็อกอิน (`/`)
* หน้าป้อนข้อมูลอีเมลและรหัสผ่านเพื่อยืนยันบทบาทเข้าสู่หน้าแดชบอร์ด

### หน้าฝั่งผู้ดูแลระบบ (`/admin/...`)
* `/admin/dashboard` — แดชบอร์ดภาพรวมสรุปเรื่องร้องเรียนประจำวัน/สัปดาห์/เดือน พร้อมตารางรายการเรื่องล่าสุด
* `/admin/member-approval` — จัดการรายการผู้สมัครขอเข้าใช้งานระบบ NT
* `/admin/permission-management` — กำหนดบทบาทสิทธิ์และเปิด/ปิดระบบสมาชิกแต่ละราย
* `/admin/problem-type` — ตั้งค่าและ Toggle การทำงานประเภทเรื่องร้องเรียนทั้งหมด
* `/admin/manual/...` — แสดงหน้าช่วยสอนและคู่มือผู้ใช้ ช่าง หรือแอดมิน

### หน้าฝั่งผู้บริหาร (`/director/...`)
* `/director/dashboard` — แสดงสรุปความก้าวหน้าการดำเนินการในลักษณะเดียวกับ Admin
* `/director/evaluate/table` — ตารางรายการเคสทั้งหมดที่อยู่ระหว่างประเมินผล
* `/director/evaluate/detail/[id]` — หน้ารายละเอียดการทำงาน พิกัดที่ตั้ง และการส่งผลประเมินผลผ่าน Emoji

---

## 🔄 Data Flow — ข้อมูลไหลยังไง?
```
ตัวอย่าง Dashboard 
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Client)                    │
│                                                          │
│  หน้า Dashboard ──→ fetch("/api/summary") ──┐            │
│                  ──→ fetch("/api/table")   ──┤            │
│                                              ▼            │
│                                        แสดงผลบนหน้า       │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP Request
                          ▼
┌──────────────────────────────────────────────────────────┐
│                    API Routes (Server)                     │
│                                                          │
│  /api/summary/route.ts                                   │
│    → getData()              ← services/DataProvider.ts    │
│    → getSummaryDataDashboard()  ← lib/summaryDashboard.ts │
│    → return JSON                                         │
│                                                          │
│  /api/table/route.ts                                     │
│    → sortDate()             ← services/DataProvider.ts    │
│    → return JSON                                         │
└─────────────────────────┬────────────────────────────────┘
                          │ อ่าน/เขียน
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   Data Layer (JSON Files)                  │
│                                                          │
│  data/alternative/data2.json  ← cases, users, techs,    │
│                                  problems, logs          │
│  data/member.json             ← ข้อมูลสมาชิก             │
└──────────────────────────────────────────────────────────┘
```

---

## 📡 API Routes
| Method | Endpoint | คำอธิบาย | Input | Output |
|---|---|---|---|---|
| **GET** | `/api/summary` | สรุปยอดรวมตัวเลขบนแดชบอร์ดทั้งหมด | — | `topCards[]`, `bottomCards[]`, `RankingCards[]` |
| **GET** | `/api/table` | ดึงเคสคำร้องเรียนทั้งหมด (เรียงตามวันเวลาล่าสุด) | — | `Case[]` |
| **GET** | `/api/member-approval/summary` | สรุปยอดคำขออนุมัติสมัครสมาชิกวันนี้ | — | `requestToday`, `pending`, `rejected`, `approved`... |
| **GET** | `/api/member-approval/table` | รายการบัญชีผู้ใช้สมาชิกทั้งหมด | — | `Member[]` |
| **POST** | `/api/member-approval/update-table` | อัปเดตสถานะการอนุมัติ/ปฏิเสธสมาชิก | `{ id, status }` | `{ success: true, data: Member[] }` |
| **GET** | `/api/permission-management/summary` | สรุปจำนวนสิทธิ์และบทบาทที่อนุมัติแล้ว | — | `{ admin, staff, auditor, inactive }` |
| **GET** | `/api/permission-management/table` | รายชื่อสมาชิกที่สามารถตั้งค่าสิทธิ์ได้ | — | `Member[]` (กรองเฉพาะ status: approved) |
| **GET** | `/api/problem-type/summary` | สรุปสถานะประเภทปัญหาทั้งหมด | — | `{ total, active, inactive }` |
| **GET** | `/api/problem-type/table` | รายการประเภทปัญหาพร้อมยอดเคสสะสม | — | `{ id, name, description, total_cases }[]` |

---

## ⚙️ Services & API Logic — ชั้นการทำงานของข้อมูล
ในโครงสร้างของระบบปัจจุบัน ฟังก์ชันหลักสำหรับประมวลผลข้อมูลร้องเรียนและการจัดการสมาชิกได้รับการปรับเปลี่ยนไปอยู่ที่ **API Routes** และโมดูลช่วยคำนวณ ส่วนชั้น **Services** จะเน้นทำหน้าที่ประกาศ Type/Interface และจัดการอ่าน/เขียนไฟล์ Mock JSON

### 1. ไฟล์ประเภทข้อมูลและโมดูลเชื่อมต่อระบบไฟล์ (Services)

#### `services/DataProvider.ts`
ไฟล์ประกาศ Type Interface โครงสร้างข้อมูลหลักของระบบ (ไม่เก็บ Logic ฟังก์ชัน):
* `Case` — โครงสร้างข้อมูลเรื่องร้องเรียน/เคสปัญหา
* `User` — โครงสร้างข้อมูลประชาชนผู้แจ้งเรื่อง
* `Technician` — โครงสร้างข้อมูลช่างเทคนิค
* `Problem` — โครงสร้างข้อมูลประเภทหัวข้อปัญหา
* `case_status_log` — โครงสร้างประวัติการเปลี่ยนสถานะเคส
* `DashboardData` — โครงสร้างรวบรวมข้อมูลทั้งหมดสำหรับนำไปประมวลผลแดชบอร์ด

#### `services/memberData.ts`
โมดูลสำหรับจัดการบันทึกข้อมูลและดึงข้อมูลสมาชิกระบบกับไฟล์ JSON:
* `readData()` — อ่านข้อมูลล่าสุดจากไฟล์ `data/member.json`
* `writeData(data)` — บันทึกข้อมูลสมาชิกชุดใหม่เขียนทับลงไฟล์ `data/member.json`

---

### 2. ฟังก์ชันภายใน API Routes (Logic ฟังก์ชันการดึง/อัปเดตข้อมูล)

#### `/api/summary/route.ts` (สรุปแดชบอร์ดหลัก)
* `getData()` — ทำความสะอาดและแมปข้อมูลดิบ JSON จัดเข้าโครงสร้าง `DashboardData` ก่อนส่งให้โมดูลคำนวณแดชบอร์ด

#### `/api/table/route.ts` (ตารางเคสแดชบอร์ด)
* `getCases()` — ดึงข้อมูลเรื่องร้องทุกข์ดิบและแมปค่าสถานะให้ถูกต้อง
* `sortDate()` — นำเคสทั้งหมดที่ได้จาก `getCases()` มาจัดเรียงตามวันที่เวลาจากใหม่สุดไปเก่าสุด

#### `/api/member-approval/summary/route.ts` (สถิติอนุมัติสมาชิก)
* `getMemberApprovalSummary()` — คำนวณตัวเลขคำขอวันนี้, ยอด Pending, Rejected, Approved และเวลาเฉลี่ยความเร็วในการอนุมัติสมาชิก

#### `/api/member-approval/table/route.ts` (รายการสมัครสมาชิก)
* `getMember()` — ดึงรายการสมาชิกทั้งหมดที่อยู่ในระบบ

#### `/api/member-approval/update-table/route.ts` (อนุมัติ/ปฏิเสธสมาชิก)
* `updateMemberStatus(id, status)` — อัปเดตสถานะ คาร์สิทธิ์ผู้สมัคร เปลี่ยนแปลงสถานะ active และบันทึกเวลาที่อนุมัติลงไฟล์ JSON ผ่าน `writeData()`

#### `/api/permission-management/summary/route.ts` (ยอดประเภทบทบาท)
* `getMemberSummary()` — กรองสมาชิกที่อนุมัติแล้ว และจัดกลุ่มสถิติตัวเลขตามระดับสิทธิ์ (แอดมิน, เจ้าหน้าที่, ผู้ตรวจสอบ, ผู้ถูกระงับสิทธิ์)

#### `/api/permission-management/table/route.ts` (ตารางจัดการสิทธิ์)
* `getApprovedMembers()` — กรองและคืนค่าข้อมูลสมาชิกเฉพาะผู้ที่ได้รับการอนุมัติใช้งาน (approved) เพื่อให้สะดวกต่อการตั้งค่าสิทธิ์

#### `/api/problem-type/summary/route.ts` (ยอดสถิติประเภทปัญหา)
* `getProblemSummary()` — นับจำนวนหัวข้อเรื่องร้องเรียนทั้งหมดแยกตามสถานะเปิดใช้งานและปิดใช้งาน

#### `/api/problem-type/table/route.ts` (ตารางประเภทปัญหาพร้อมยอดเคส)
* `getProblemWithCounts()` — รวมกลุ่มเคสร้องเรียน และเชื่อมโยงนับยอดจำนวนเคสร้องทุกข์สะสมของแต่ละประเภทปัญหา

---

### 3. ฟังก์ชันคำนวณสรุปสถิติแดชบอร์ด (`lib/summaryDashboard.ts`)
โมดูลคำนวณและประมวลผลสถิติต่าง ๆ โดยจะรับอ็อบเจกต์ข้อมูล `data: DashboardData` เข้ามาเป็นพารามิเตอร์:
* `summaryToday(data)` — นับยอดรวมเคสร้องทุกข์ในวันปัจจุบัน
* `summaryMonth(data)` — นับยอดรวมเคสร้องทุกข์ในเดือนปัจจุบัน
* `summaryPending(data)` — นับจำนวนเคสทั้งหมดที่ยังอยู่ระหว่าง "รอดำเนินการ"
* `summaryResolved(data)` — นับจำนวนเคสที่ดำเนินการเสร็จสิ้นสำเร็จแล้ว
* `summaryWeek(data)` — นับจำนวนเคสใหม่ที่เกิดขึ้นในรอบ 7 วันล่าสุด
* `summaryAvgCloseTime(data)` — สรุปเวลาเฉลี่ย (วัน) ที่เริ่มเปิดเคส Pending จนปิดงาน Resolved ของทุกเคส
* `getRanking(data)` — หา 3 อันดับของปัญหาร้องเรียนยอดนิยม (Top 3) และคิดสัดส่วนเปอร์เซ็นต์
* `getSummaryDataDashboard(data)` — รวบรวมข้อมูลสรุปในทุก ๆ การ์ดมารวมเป็นผลลัพธ์เดียว


---

## 🧩 Components
### 🏗️ Shell Components (ส่วนโครงสร้าง Layout)
#### `AdminShell` — [adminshell.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/app/adminshell.tsx)
* **หน้าที่**: จัดการ Layout ของแอดมิน โดยผูก Navbar + Sidebar และควบคุมความปลอดภัยด้านบทบาท (Role Checking)
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `children` | `React.ReactNode` | หน้าเว็บเพจย่อยที่จะเรนเดอร์ด้านใน |

#### `DirectorShell` — [directorshell.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/app/directorshell.tsx)
* **หน้าที่**: โครงสร้างแบบเดียวกับ `AdminShell` แต่ตั้งสิทธิ์สแกนตรวจสอบสิทธิ์เป็น `"director"`

---

### 📊 Components ใช้ร่วมกัน (`components/ui/Admin_director/`)
#### `AdminNavbar` — [AdminNavbar.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/AdminNavbar.tsx)
* **หน้าที่**: แถบด้านบนสำหรับผู้ดูแลระบบ แสดง Breadcrumbs ลิงก์ตามพิกัด URL และมีปุ่มเปิด/ปิด Sidebar
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `isOpen` | `boolean` | สถานะการหด/ขยายเมนูด้านซ้าย |
  | `onMenuClick`| `() => void` | คอลแบ็กเมื่อกดปุ่ม Hamburger menu |

#### `AdminSidebar` — [AdminSidebar.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/AdminSidebar.tsx)
* **หน้าที่**: เมนูด้านข้างของ Admin มี Accordion สำหรับสลับคู่มือการใช้งานและลิงก์หน้าต่างตั้งค่าต่าง ๆ
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `isOpen` | `boolean` | แสดงผลหรือหดเมนู |

#### `SummaryCard` — [SummaryCard.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/SummaryCard.tsx)
* **หน้าที่**: การ์ดแสดงสถิติค่าสำคัญแถวบน เช่น ยอดรอดำเนินการ หรือความเร็วการปิดงาน
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `title` | `string` | หัวข้อตัวเลขสถิติ |
  | `value` | `number \| string` | ยอดรวม (มีการใส่เลข 0 นำหน้าอัตโนมัติหากเป็นเลขหลักเดียว) |
  | `subvalue` | `string \| number` | หน่วยหรือข้อความอธิบายเพิ่ม |
  | `color` | `string` | รหัสสีสำหรับขอบด้านซ้าย |

#### `SummaryCard2` — [SummaryCard2.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/SummaryCard2.tsx)
* **หน้าที่**: การ์ดตัวเลขสรุปที่มีขนาดใหญ่ขึ้น มีป้ายวงกลมและไอคอนเด่นอยู่ฝั่งซ้ายของข้อมูล
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `icon` | `ComponentType \| string` | component ของ SVG ไอคอน หรือ url รูปภาพ |
  | `title` | `string` | ชื่อข้อมูลสถิติ |
  | `value` | `number \| string` | จำนวนค่าสะสม |
  | `color` | `string` | สีพื้นหลังของวงกลมไอคอน |

#### `RankingCard` — [RankingCard.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/RankingCard.tsx)
* **หน้าที่**: การ์ดจัดอันดับแสดงปัญหาที่มีเคสเข้ามาสูงสุด 3 อันดับแรก แสดงผลคู่กับหลอด Progress Bar คาดคะเน
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `rank` | `number` | ตัวเลขอันดับ (1, 2, 3) |
  | `title` | `string` | ชื่อประเภทปัญหานั้น |
  | `subvalue` | `string \| number` | สัดส่วนเปอร์เซ็นต์สะสม |

#### `DataTable` — [DataTable.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/DataTable.tsx)
* **หน้าที่**: ตารางสำเร็จรูปสำหรับวนลูปแสดงข้อมูลอัตโนมัติ คอลัมน์รองรับฟังก์ชัน custom render
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `columns` | `Column[]` | การกำหนดค่าชื่อหัวตาราง แหล่งคีย์ข้อมูล และ renderer |
  | `data` | `any[]` | ชุดแถวข้อมูลที่จะพิมพ์ลงในตาราง |

#### `DataTableBase` — [DataTableBase.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/DataTableBase.tsx)
* **หน้าที่**: โครงตารางเปล่าที่มีเฉพาะส่วนหัวตาราง เหมาะสำหรับหน้าตารางที่มี logic ซับซ้อนภายในแถว
* **Props**: `columns`, `theadClassName` และ `children` สำหรับส่งส่วน body ของตารางเข้ามาเอง

#### `PageNavigation` — [PageNavigation.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/PageNavigation.tsx)
* **หน้าที่**: แถบปุ่ม Pagination สลับเปลี่ยนหน้าของข้อมูลตาราง
* **Props**: `currentPage`, `totalPages`, และคอลแบ็กฟังก์ชัน `onPageChange`

#### `ComplainToolbar` — [ComplainToolbar.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/ComplainToolbar.tsx)
* **หน้าที่**: แถบเครื่องมือจัดการเคสสำเร็จรูป รวบรวมฟังก์ชันค้นหา, คัดกรอง, และออกไฟล์รายงานไว้ที่เดียวกัน
* **Props**: `activeTab`, `searchValue`, คอลแบ็ก `onSearchChange`, `onFilterClick`, `onExportClick`

#### `FilterModal` — [FilterModal.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/FilterModal.tsx)
* **หน้าที่**: หน้าต่างป็อปอัปกรองข้อมูลแบบแสดงกล่อง Checkbox แยกตามสิทธิ์ช่างเทคนิคหรือบทบาทสมาชิก

#### `ProblemTypeModal` — [ProblemTypeModal.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/ProblemTypeModal.tsx)
* **หน้าที่**: แบบฟอร์มเพิ่ม/แก้ไขปัญหา โดยดึง `emoji-picker-react` เข้ามาอำนวยความสะดวกในการแสดงผลเลือกไอคอน

#### `EditMemberModal` — [EditMemberModal.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/EditMemberModal.tsx)
* **หน้าที่**: แบบฟอร์มแก้ไขระดับสิทธิ์ หน่วยงาน หรือเปิด/ปิดการเปิดรับเรื่องของพนักงานแบบรายบุคคล

#### `Toggle` — [Toggle.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/Toggle.tsx)
* **หน้าที่**: ปุ่มเลื่อนเปิด/ปิดดีไซน์สไตล์ iOS สำหรับเปิดหรือปิดตัวเลือกต่าง ๆ
* **Props**: `checked`, `onChange`, `disabled`

#### `OptionMenu` — [OptionMenu.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Admin_director/OptionMenu.tsx)
* **หน้าที่**: ปุ่มเมนูสามจุดแนวตั้งสำหรับตัวเลือกปรับแต่งรายแถวของตารางข้อมูล (สร้างบน MUI Menu)

---

### 🎬 Components เฉพาะ Director (`components/ui/Director/`)
#### `CardDetail` — [CardDetail.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Director/CardDetail.tsx)
* **หน้าที่**: การ์ดแสดงผลรายละเอียดข้อมูลปัญหาแบบสมบูรณ์ มีส่วนแสดงชื่อเรื่อง รายละเอียด ปลายทาง และไฟล์แนบ JPG/PDF

#### `CardMap` — [CardMap.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Director/CardMap.tsx)
* **หน้าที่**: การ์ดแสดงแผนที่พร้อมระบุจุดเกิดพิกัดจากละติจูดและลองจิจูดของเคสปัญหา

#### `fileCard` — [fileCard.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Director/fileCard.tsx)
* **หน้าที่**: การ์ดแสดงผลของเอกสารคู่มือการสอนหรือรูปภาพแนบในหน้าคู่มือระบบ
* **Props**:
  | Prop | Type | คำอธิบาย |
  |---|---|---|
  | `item` | `FileItem` | อ็อบเจกต์ระบุชื่อ, คำอธิบาย, วันที่บันทึก, และขนาดของไฟล์แนบ |

#### `Filtermodal` — [Filtermodal.tsx](file:///c:/Users/tapan/OneDrive/Desktop/Kai/KaifongAI/components/ui/Director/Filtermodal.tsx)
* **หน้าที่**: หน้าต่างกรองผลลัพธ์ของเคสเฉพาะสำหรับระดับผู้บริหาร โดยกรองตามการเปลี่ยนสถานะหรือหัวข้อปัญหาหลัก

---

## 🎨 Design System (สี / ธีม)
โทนสีหลักของระบบได้รับการกำหนดค่าผ่าน CSS Variables บนไฟล์ `app/globals.css` ดังนี้:
```css
--background: #FFFFFF;        /* สีพื้นหลังของเว็บไซต์หลัก */
--surface: #FFFFFF;           /* สีของกรอบการ์ดแสดงผล */
--surface2: #F5F6FA;          /* สีพื้นผิวของส่วนข้อมูลรอง */
--foreground: #161B29;       /* สีอักษรหลัก */
--foreground2: #4D4632;      /* สีอักษรภายในตารางและรายการย่อย */
--primary: #161B29;          /* สีดำเข้มของ Sidebar / Header */
--accent: #FFD100;           /* สีเหลือง NT ที่เป็นเอกลักษณ์ของแบรนด์ */
--success: #10B981;          /* สีเขียวสถานะ Resolved */
--warning: #D97706;          /* สีส้มสถานะ In Progress */
--danger: #E11D48;           /* สีแดงสถานะ Pending หรือการปฏิเสธคำขอ */
```

---

## 🗄 ข้อมูล Mock Data
ระบบยังไม่ได้ทำการเชื่อมต่อฐานข้อมูลหลัก โดยดึงและเก็บข้อมูลผ่านโครงสร้างจำลองดังนี้:
* `data/alternative/data2.json` — เก็บอาร์เรย์ข้อมูลหลักของเคสคำร้องเรียน ช่างเทคนิค ผู้ใช้ทั่วไป และประเภทปัญหารวมถึงประวัติล็อกการเปลี่ยนแปลง
* `data/member.json` — ดึงรายชื่อกลุ่มพนักงานที่สมัครเข้ามาในระบบ เพื่อทำแบบฟอร์มการกำหนดสิทธิ์

---

## ⚡ สิ่งที่ควรรู้ก่อนแก้โค้ด
1. **การบันทึกสมาชิกลงไฟล์จริง** — ฟังก์ชันจัดการของ `memberData.ts` ใช้โมดูลระบบไฟล์ `fs` ในการเขียนทับลงไฟล์ `member.json` ทันทีเมื่อกดอนุมัติหรือตั้งค่าสิทธิ์ เพื่อให้ข้อมูลคงทนอยู่ระหว่างทดลองรันระบบ
2. **ระบบล็อกอินจำลอง** — ฟังก์ชันล็อกอินที่หน้าหลักทำการตรวจสอบอีเมลและพาสเวิร์ดผ่านการเช็คเงื่อนไขตรง (Hardcode)
3. **การปรับแต่งสีธีม** — ค่าการปรับแต่งเฉดสีทั้งหมดจะผูกกับ CSS Variables ในไฟล์ `app/globals.css` เป็นหลัก
4. **ความเข้ากันได้** — รองรับเบราว์เซอร์สมัยใหม่และมีความเข้ากันได้ทางภาษา TypeScript อย่างสมบูรณ์ผ่านตัวประเมินชนิดตัวแปร
5. **mock Data ตารางไม่สอดคล้องกันในระบบอัปเดตใหม่** - ข้อมูลจำลองนี้ต้องเปลี่ยนเป็นข้อมูลจำลองของ ดาต้าเบสที่อัพเดทใหม่ซึ่งมีการเปลี่ยนแปลงที่ค่อนข้างเยอะในส่วนหลังบ้าน เช่น สถานะและตารางฟิลด์อื่นๆรวมถึงชื่อตารางด้วย โดยไฟล์ที่จะต้องแก้หลักๆคือ api/ และ lib/summaryDashboard รวมถึง service/DataProvider ด้วย
6. **คำอธิบายโค้ดโดยละเอียด** มีอยู่ในโปรเจคแล้ว
      

---

> 📌 **เอกสารนี้อัปเดตล่าสุด**: 13 มิถุนายน 2569 (2026)
