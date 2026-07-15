# Kaifong Project

ระบบจัดการเรื่องร้องเรียน Kaifong ประกอบด้วย Frontend, Backend และฐานข้อมูล PostgreSQL ที่ทำงานผ่าน Docker

---

## สิ่งที่ต้องติดตั้ง

- Git
- Git LFS
- Docker Desktop

ติดตั้ง Git LFS (ครั้งแรกเท่านั้น)

```bash
git lfs install
```

---

## 1. Clone Project

```bash
git clone https://github.com/Thxngfh/KaifongDocker.git
cd KaifongDocker
```

หากไฟล์ฐานข้อมูลยังไม่ถูกดาวน์โหลด

```bash
git lfs pull
```

---

## 2. Start Docker

```bash
docker compose down -v
docker compose up --build -d
```

ตรวจสอบว่า Container ทำงาน

```bash
docker ps
```

---

## 3. Restore Database (ครั้งแรกเท่านั้น)

```powershell
Get-Content db/dumps/complaint_system_db_v002.sql |
docker exec -i kaifong_db psql -U kaifong -d kaifongdb
```

---

## 4. ตรวจสอบจำนวนตาราง

เข้าสู่ PostgreSQL

```bash
docker exec -it kaifong_db psql -U kaifong -d kaifongdb
```

จากนั้นรัน

```sql
SELECT table_type, COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY table_type;
```

ผลลัพธ์ที่ถูกต้อง

 table_type | count 
------------+-------
 VIEW       |     2
 BASE TABLE |    40
(2 rows)

หากได้ 41 ตาราง แสดงว่าฐานข้อมูลพร้อมใช้งาน

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
KaifongDocker
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

git clone https://github.com/Thxngfh/KaifongDocker.git
cd KaifongDocker

docker compose down -v
docker compose up --build -d

Get-Content db/dumps/complaint_system_db_v002.sql |
docker exec -i kaifong_db psql -U kaifong -d kaifongdb

docker exec -it kaifong_db psql -U kaifong -d kaifongdb

SELECT table_type, COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY table_type;
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