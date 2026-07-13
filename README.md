# Kaifong Project

ระบบจัดการเรื่องร้องเรียน Kaifong ประกอบด้วย Frontend, Backend และฐานข้อมูล PostgreSQL ที่ทำงานผ่าน Docker

---

# สิ่งที่ต้องติดตั้งก่อน

- Git
- Git LFS
- Docker Desktop

## ติดตั้ง Git LFS (ทำเพียงครั้งเดียว)

```bash
git lfs install
```

---

# วิธีใช้งาน

## 1. Clone โปรเจกต์

```bash
git clone <Repository URL>
cd KaifongProject
```

> เนื่องจากโปรเจกต์ใช้ **Git LFS** ไฟล์ฐานข้อมูลจะถูกดาวน์โหลดอัตโนมัติหลัง Clone

หากไฟล์ไม่ถูกดาวน์โหลด สามารถรัน

```bash
git lfs pull
```

---

## 2. เปิด Docker

```bash
docker compose up --build -d
```

ตรวจสอบว่า Container ทำงาน

```bash
docker ps
```

---

## 3. Restore ฐานข้อมูล (ครั้งแรกเท่านั้น)

นำเข้าฐานข้อมูลจากไฟล์

```
db/dumps/complaint_system_db_v002.sql
```

รันคำสั่ง

```bash
psql -h localhost -p 5433 \
-U kaifong \
-d kaifongdb \
-f db/dumps/complaint_system_db_v002.sql
```

เมื่อ Restore สำเร็จ ครั้งถัดไปไม่ต้อง Restore ใหม่ (ตราบใดที่ไม่ได้ลบ Docker Volume)

---

# การเข้าใช้งานระบบ

### LIFF Frontend

```
http://localhost:3000
```

### AI / Dashboard

```
http://localhost:3001
```

---

# ข้อมูลฐานข้อมูล

| รายการ | ค่า |
|--------|------|
| Host | localhost |
| Port | 5433 |
| Database | kaifongdb |
| Username | kaifong |
| Password | kaifong1234 |

---

# คำสั่งที่ใช้บ่อย

### เปิดระบบ

```bash
docker compose up -d
```

### Build ใหม่

```bash
docker compose up --build
```

### ปิดระบบ

```bash
docker compose down
```

### ลบ Container และฐานข้อมูลทั้งหมด

```bash
docker compose down -v
```

### ดู Log

```bash
docker compose logs -f
```

---

# โครงสร้างโปรเจกต์

```
KaifongProject
│
├── db
│   ├── dumps
│   ├── init
│   ├── migrations
│   └── seed
│
├── kaifongai
│
├── kaifongliff
│
├── docker-compose.yml
│
└── README.md
```

---

# หมายเหตุ

- โปรเจกต์นี้ใช้ **Git LFS** สำหรับจัดเก็บไฟล์ฐานข้อมูล (`complaint_system_db_v002.sql`)
- กรุณาติดตั้ง Git LFS ก่อน Clone โปรเจกต์
- หาก Clone แล้วไม่พบไฟล์ฐานข้อมูล ให้รัน

```bash
git lfs pull
```

---

# ขั้นตอนการติดตั้ง (สรุป)

```bash
git lfs install

git clone <Repository URL>

cd KaifongProject

docker compose up --build -d

psql -h localhost -p 5433 \
-U kaifong \
-d kaifongdb \
-f db/dumps/complaint_system_db_v002.sql
```

จากนั้นเข้าใช้งานได้ที่

- LIFF : http://localhost:3000
- AI : http://localhost:3001

## การอัปเดตโปรเจกต์

หากมีการอัปเดตจาก GitHub ให้รัน

```bash
git pull
git lfs pull
docker compose up --build -d
```