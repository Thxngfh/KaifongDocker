# Clustering Training Job — วิธีติดตั้งเข้า KaifongDocker

## 1. วางไฟล์

Copy โฟลเดอร์ `cluster/` ทั้งหมดนี้ไปไว้ในโปรเจกต์ `KaifongDocker` เช่น:

```
KaifongDocker/
└── ml_jobs/
    └── cluster/
        ├── Dockerfile
        ├── requirements.txt
        ├── entrypoint.sh
        └── train_cluster_model.py
```

## 2. เพิ่ม service ใน docker-compose.yml

เปิดไฟล์ `docker-compose.yml` เดิมของโปรเจกต์ แล้วเพิ่ม service นี้เข้าไปในส่วน `services:`
(แก้ `db` ในบรรทัด `DATABASE_URL` ให้ตรงกับชื่อ service ของ database container จริงในไฟล์คุณ
— ถ้าไม่แน่ใจว่าชื่อ service คือ "db" หรือชื่ออื่น ให้ดูใน docker-compose.yml เดิม):

```yaml
  ml-cluster-job:
    build: ./ml_jobs/cluster
    container_name: kaifong_ml_cluster_job
    restart: unless-stopped
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://kaifong:kaifong1234@db:5432/kaifongdb
      RETRAIN_INTERVAL_SECONDS: "604800"   # 7 วัน (แก้เป็นวินาทีอื่นได้ถ้าต้องการ)
      RUN_ON_START: "true"                  # true = รันทันทีตอน container ขึ้นครั้งแรก, ไม่ต้องรอ 7 วัน
```

**หมายเหตุเรื่อง connection string:** ใน `docker-compose.yml` service ต่อกันผ่านชื่อ service (ไม่ใช่ `localhost`)
และใช้ port ภายใน container (5432) ไม่ใช่ port ที่ map ออกมาข้างนอก (5433 ตามที่ README หลักบอก)

## 3. รัน

```bash
docker compose up --build -d ml-cluster-job
```

หรือรันพร้อมทุก service เลย:

```bash
docker compose up --build -d
```

## 4. เช็คว่าทำงานถูกต้อง

```bash
docker compose logs -f ml-cluster-job
```

ควรเห็น log แบบนี้ (มี timestamp กำกับทุกบรรทัด):

```
[2026-07-13T10:00:00] === Starting complaint clustering training job ===
[2026-07-13T10:00:01] complaints          :  31,000 rows
...
[2026-07-13T10:00:15] Wrote clustering results to DB: run_id=..., 4 clusters, 43 district mappings
[2026-07-13T10:00:15] === Job finished successfully ===
=== [entrypoint] Sleeping for 604800s ...
```

## 5. ทดสอบแบบไม่ต้องรอ 7 วัน

ถ้าอยากลองรันทันทีอีกครั้งโดยไม่รอ interval ครบ:

```bash
docker compose exec ml-cluster-job python train_cluster_model.py
```

## ปรับแต่งได้ผ่าน environment variables

| ตัวแปร | ค่า default | ความหมาย |
|---|---|---|
| `DATABASE_URL` | (ต้องตั้งเอง) | connection string ไปยัง database |
| `RETRAIN_INTERVAL_SECONDS` | `604800` (7 วัน) | รอบเวลาที่จะ retrain ใหม่ |
| `RUN_ON_START` | `true` | รันทันทีตอน container start ครั้งแรกหรือรอครบ interval ก่อน |
| `CLUSTER_MAX_K` | `6` | จำนวน cluster สูงสุดที่ยอมให้ลอง |
| `CLUSTER_PCA_COMPONENTS` | `2` | จำนวน PCA component ที่เก็บ (สำหรับกราฟ dashboard) |

## ข้อควรรู้ / ข้อจำกัดที่ยังคงอยู่จาก notebook เดิม

- Query ยังดึงข้อมูล **ทุก tenant ปนกัน** (ไม่มี `WHERE tenant_id = ...`) — ตรงกับที่เคยคุยไว้ก่อนหน้าว่า
  ตาราง `cluster_model_runs` ยังไม่มีคอลัมน์ `tenant_id` ในสคีมา ถ้ายังมี tenant เดียว (BMA) ไม่กระทบอะไร
  แต่ถ้าจะขยายหลาย tenant ต้องแก้ schema + query ส่วนนี้ก่อน (แจ้งได้ถ้าต้องการให้ช่วยแก้)
- เขตที่มีเรื่องร้องเรียนน้อยกว่า 5 เรื่องจะถูกตัดออกจากการจัดกลุ่ม (ตามเดิมจาก notebook)
- Job นี้เป็นแค่โมเดล clustering เท่านั้น ยังไม่รวม script ของโมเดล SLA breach risk prediction
  (`complaint_risk_prediction_v3` ที่อ้างถึงใน schema) — ถ้ามี notebook/script ของโมเดลนั้นด้วย ส่งมาได้เลย
  จะทำ service แยกให้อีกตัวแบบเดียวกันนี้
