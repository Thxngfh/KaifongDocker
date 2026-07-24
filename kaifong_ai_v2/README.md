# Kaifong AI — Backend

ระบบ Backend สำหรับ Kaifong AI: รับคำร้องเรียนพร้อมรูปภาพและคำอธิบาย แล้วใช้ AI (CLIP + NLP) ช่วยตรวจสอบความสอดคล้องของข้อมูล ก่อนตัดสินใจว่าจะรับเรื่องทันที ส่งให้เจ้าหน้าที่ตรวจสอบ หรือปฏิเสธ

คู่มือนี้ใช้ได้ทั้ง **Windows** และ **macOS** — คำสั่งไหนต่างกันจะแยกให้ชัดเจน

---

## สิ่งที่ต้องมีก่อนเริ่ม (Prerequisites)

- **Python 3.10 ขึ้นไป**
  - Windows: ดาวน์โหลดจาก [python.org](https://www.python.org/downloads/) — ตอนติดตั้งอย่าลืมติ๊ก "Add Python to PATH"
  - macOS: ใช้ `brew install python3` (ถ้ามี [Homebrew](https://brew.sh/)) หรือดาวน์โหลดจาก python.org เช่นกัน
- **PostgreSQL** (สำหรับฐานข้อมูล) — ติดตั้งเครื่อง หรือใช้ตัวที่ทีม DB จัดเตรียมไว้ให้
- **Git** (สำหรับ clone โปรเจกต์)

ตรวจสอบว่าติดตั้งถูกต้อง:

```bash
python3 --version
pip3 --version
git --version
```

> บน Windows บางเครื่องใช้คำสั่ง `python` และ `pip` แทน `python3` / `pip3` — ถ้าคำสั่งข้างบนไม่เจอ ให้ลองแบบไม่มี `3`

---

## ขั้นตอนติดตั้ง

### 1) เข้าไฟล์

```bash
cd kaifong_ai
```

### 2) สร้าง Virtual Environment (venv)

แยก dependency ของโปรเจกต์นี้ออกจาก Python หลักของเครื่อง

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

เมื่อ activate สำเร็จ จะเห็น `(venv)` ขึ้นหน้า prompt ในเทอร์มินัล

> ทุกครั้งที่เปิดเทอร์มินัลใหม่มาทำงานต่อ ต้อง activate venv ใหม่ด้วยคำสั่งข้างบนเสมอ

### 3) ติดตั้ง Dependency

```bash
pip install -r requirements.txt --break-system-packages
```

> flag `--break-system-packages` จำเป็นเฉพาะบางระบบ (เช่น macOS ที่ใช้ Python ผ่าน Homebrew หรือ Linux บางจำหน่าย) ถ้าเจอ error ว่า externally-managed-environment ให้ใส่ flag นี้ ถ้าไม่เจอ error ตัด flag นี้ออกได้เลย

โปรเจกต์นี้ใช้โมเดล AI (`sentence-transformers`, `torch`) ซึ่งมีขนาดใหญ่ ตอนติดตั้งครั้งแรกอาจใช้เวลาหลายนาที

### 4) ตั้งค่า Environment Variables

คัดลอกไฟล์ตัวอย่างแล้วกรอกค่าจริง:

**Windows:**
```cmd
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

จากนั้นเปิดไฟล์ `.env` แล้วกรอกค่าจริง:

```env
DATABASE_URL=postgresql://kaifong:kaifong1234@localhost:5433/kaifongdb
LINE_CHANNEL_ACCESS_TOKEN=2009976440-qF0Wpy5x
ALLOWED_ORIGINS=http://localhost:8000,https://your-liff-domain.com
```

⚠️ **ห้าม commit ไฟล์ `.env` ขึ้น Git เด็ดขาด** — ไฟล์นี้ถูกกันไว้ใน `.gitignore` แล้ว แต่ให้ตรวจสอบอีกครั้งก่อน push ทุกครั้ง

> ⚠️ **สำคัญ:** ไฟล์ `.env` เวอร์ชันเก่าเคย push ขึ้น git มาก่อนโดยไม่ตั้งใจ — credential เก่าที่เคยอยู่ในนั้น (database password, LINE token) **ถือว่าไม่ปลอดภัยแล้วและถูกเปลี่ยนใหม่แล้ว** ห้ามคัดลอกค่าจากไฟล์เก่าในประวัติ git มาใช้ ให้ขอค่าปัจจุบันจากหัวหน้าโปรเจกต์/ทีม DB โดยตรงเท่านั้น

ถ้าไม่ได้ตั้งค่า `DATABASE_URL` หรือ `LINE_CHANNEL_ACCESS_TOKEN` ระบบจะ error ทันทีตอน start (เป็นการป้องกันไม่ให้รันด้วยค่า default ที่ไม่ปลอดภัย)

### 5) รันเซิร์ฟเวอร์

```bash
uvicorn main:app --reload
```

เปิดเบราว์เซอร์ไปที่:

- `http://127.0.0.1:8000` — หน้าแรก เช็คว่า server ทำงาน
- `http://127.0.0.1:8000/docs` — Swagger UI ทดสอบ API ได้ทันทีในเบราว์เซอร์

---

## โครงสร้างไฟล์หลัก

| ไฟล์ | หน้าที่ |
|---|---|
| `main.py` | FastAPI app หลัก, กำหนด endpoint (`/verify-image`, `/test-score`), CORS |
| `clip_engine.py` | AI Score Engine — วิเคราะห์รูปภาพ (CLIP) + ข้อความ (NLP) แล้วตัดสินใจ ACCEPT/REVIEW/REJECT |
| `db.py` | เชื่อมต่อ PostgreSQL, query ข้อมูล category/team/complaint |
| `security.py` | ตรวจสอบ API Key (`X-API-Key`) + บันทึก audit log |
| `line_notifier.py` | ส่งข้อความแจ้งเตือนช่างผ่าน LINE Messaging API |
| `config.py` | โหลดค่า environment variables ทั้งหมด |
| `.env.example` | Template ของ environment variables — copy เป็น `.env` แล้วกรอกค่าจริง |
| `requirements.txt` | รายชื่อ Python package ที่ต้องติดตั้ง |
| `Procfile` | คำสั่งรัน server ตอน deploy บน Railway |

---

## การทดสอบ API

ทุก endpoint ต้องแนบ header `X-API-Key` — key เริ่มต้นจะถูกสร้างอัตโนมัติและแสดงในเทอร์มินัลตอนรันครั้งแรก (เก็บไว้ให้ดี ไม่แสดงซ้ำ)

### วิธีจัดการ API Key (สำคัญ — อ่านก่อนรันครั้งแรก)

- Key ถูกเก็บแบบ **hash (SHA-256)** ในไฟล์ `api_keys.json` เท่านั้น ไม่มีการเก็บค่าจริง (plaintext) ไว้ที่ไหนเลย — เหมือนหลักการเก็บรหัสผ่านทั่วไป ถอดกลับเป็นค่าเดิมไม่ได้
- ไฟล์ `api_keys.json` **ห้าม commit ขึ้น git** (ต้องอยู่ใน `.gitignore`)
- ถ้ายังไม่มีไฟล์ `api_keys.json` เลย ระบบจะ**สร้าง key เริ่มต้นให้อัตโนมัติตอน start ครั้งแรก** แล้ว print key ตัวจริงออกมาที่เทอร์มินัล **แค่ครั้งเดียวเท่านั้น**

```
⚠️  ยังไม่มีไฟล์ api_keys.json — สร้าง API Key เริ่มต้นให้แล้ว
    API KEY (เก็บไว้ให้ดี ไม่แสดงซ้ำอีก): a1b2c3d4e5f6...
```

**ต้อง copy key นี้เก็บไว้ทันที** (เช่นใน password manager) — เพราะหลังจากนี้ระบบมีแต่ hash เก็บอยู่ในไฟล์เท่านั้น **ไม่มีทางดึงค่าจริงกลับมาดูได้อีก** ถ้าพลาดไปแล้วต้องลบไฟล์ `api_keys.json` ทิ้งแล้วรันใหม่เพื่อ gen key ใหม่แทน (key เก่าจะใช้ไม่ได้อีกต่อไป)

**ทดสอบผ่าน Swagger UI** (`/docs`) — เหมาะกับเช็คเร็วๆ ไม่ต้องติดตั้งอะไรเพิ่ม

**ทดสอบผ่าน Postman** — เหมาะกับทดสอบที่ต้องอัปโหลดรูปภาพ + เก็บ request ไว้ใช้ซ้ำ:
1. สร้าง request แบบ `POST` ไปที่ `http://127.0.0.1:8000/test-score`
2. แท็บ Headers เพิ่ม `X-API-Key` = ค่าที่ได้จากเทอร์มินัล
3. แท็บ Body เลือก `form-data` ใส่ฟิลด์: `category`, `subcategory`, `description`, `image` (type: File)
4. กด Send

---

## Deploy ขึ้น Production (Railway)

1. Push โค้ดขึ้น GitHub (เช็คว่า `.env` ไม่ติดไปด้วย)
2. สร้างโปรเจกต์ใหม่ใน [Railway](https://railway.app) → Deploy from GitHub repo
3. ไปที่ **Variables** tab ตั้งค่า `DATABASE_URL`, `LINE_CHANNEL_ACCESS_TOKEN`, `ALLOWED_ORIGINS` ให้ครบ
4. ไปที่ **Settings → Networking** กด **Generate Domain** เพื่อได้ HTTPS URL ถาวร
5. อัปเดต Endpoint URL ใน LINE Developers Console ให้ชี้มาที่ domain ใหม่นี้

---

## ปัญหาที่พบบ่อย (Troubleshooting)

| อาการ | วิธีแก้ |
|---|---|
| `ModuleNotFoundError` ตอนรัน | ลืม activate venv ก่อนรัน — ดูขั้นตอนที่ 2 |
| `RuntimeError: ต้องตั้งค่า DATABASE_URL...` | ยังไม่ได้สร้างไฟล์ `.env` หรือสะกดชื่อตัวแปรผิด |
| ติดตั้ง `torch` แล้ว error / ช้ามาก | ปกติสำหรับเครื่องที่ไม่มี GPU — รอให้เสร็จ (ใช้เวลานานตอนแรกเท่านั้น) |
| ยิง Postman แล้วได้ `401 Unauthorized` | ไม่ได้แนบ header `X-API-Key` หรือสะกดชื่อ header ผิด (ต้องเป๊ะว่า `X-API-Key`) |
| ยิง Postman แล้วได้ `403 Forbidden` | แนบ header มาแล้วแต่ค่า key ไม่ตรงกับที่ระบบสร้างไว้ |
| macOS ติดตั้ง package แล้วเจอ `externally-managed-environment` | ใส่ flag `--break-system-packages` ต่อท้ายคำสั่ง `pip install` |

---

## หมายเหตุด้านความปลอดภัย

- ห้าม commit ไฟล์ `.env`, `api_keys.json`, `audit.log`, `kaifong_debug.log` ขึ้น Git
- ข้อความที่ user พิมพ์อาจมีข้อมูลส่วนบุคคล (PII) หลุดมาได้ — ระบบมีการ mask เบอร์โทรและชื่อที่มีคำนำหน้าก่อนเขียนลง log แล้ว แต่ยังไม่ครอบคลุม 100%
- ก่อนเปิดใช้งานจริงกับประชาชน ควรปรึกษาฝ่ายกฎหมาย/compliance เรื่อง PDPA