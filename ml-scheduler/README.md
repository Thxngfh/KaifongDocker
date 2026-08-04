# ML Scheduler (Train ทุก 7 วัน + Score เคสใหม่แบบ Real-time)

มี 2 container ที่ทำงานร่วมกัน:

1. **`ml-scheduler`** — รัน `train_cluster_model.py` และ `train_risk_model.py` ตามลำดับ
   ทุก 7 วัน ผ่าน cron ภายใน container เอง (เทรนโมเดลใหม่ + batch score เคสที่เปิดอยู่ทั้งหมด)
2. **`risk-listener`** (ใหม่) — ฟัง Postgres `LISTEN/NOTIFY` ตลอด 24/7 พอมี complaint ใหม่เข้ามา
   จะ score เคสนั้นทันทีด้วยโมเดลที่ `active` อยู่ (ไม่ต้องรอรอบ cron ครบ 7 วัน)

ทั้ง 2 container ใช้ Dockerfile/image เดียวกัน ต่างกันแค่ command ที่รัน

## โครงสร้างไฟล์

```
ml-scheduler/
├── Dockerfile                    # build image พร้อม cron + dependencies (ใช้ร่วมกัน 2 container)
├── entrypoint.sh                 # ติดตั้ง crontab แล้ว start cron (ใช้กับ ml-scheduler เท่านั้น)
├── crontab                       # กำหนดตารางเวลา (ทุกวันอาทิตย์ 02:00)
├── run_training.sh               # สคริปต์ที่ cron เรียก รันทั้ง 2 โมเดลตามลำดับ + log
├── requirements.txt              # dependencies ของทุกสคริปต์ (train/score/listener)
├── risk_features.py              # [ใหม่] ไฟล์กลาง feature engineering — ใช้ร่วมกันทุกไฟล์
│                                    (single source of truth กัน train/score ไม่ตรงกัน)
├── train_cluster_model.py        # อ่าน DATABASE_URL จาก env
├── train_risk_model.py           # อ่าน DATABASE_URL จาก env + import จาก risk_features.py
├── score_new_complaint.py        # [ใหม่] score เคสเดียวแบบ on-demand (โหลด .joblib ที่ active)
├── listener.py                   # [ใหม่] ฟัง Postgres NOTIFY ตลอดเวลา แล้วเรียก score_new_complaint.py
├── docker-compose.snippet.yml    # ตัวอย่าง service ml-scheduler + risk-listener
└── README_DEPLOY.md              # [ใหม่] ลำดับขั้นตอน deploy แบบละเอียด (SQL migration, build, ทดสอบ)

db/migrations/
└── 001_add_new_complaint_notify.sql   # [ใหม่] Trigger ที่ยิง NOTIFY ตอน insert complaint ใหม่
```

## วิธีติดตั้งเข้ากับ KaifongDocker

### 1. รัน SQL migration ก่อน (ทำก่อนแตะ Docker)

```bash
psql "$DATABASE_URL" -f db/migrations/001_add_new_complaint_notify.sql
```
สร้าง trigger `trg_notify_new_complaint` ที่ยิง `pg_notify` ทุกครั้งที่มี complaint ใหม่
เข้าตาราง `complaints` — ถ้าไม่รันสเตปนี้ก่อน `risk-listener` จะฟังเปล่าไปเรื่อยๆ (ไม่ error แต่ก็ไม่ทำงาน)

### 2. คัดลอกโฟลเดอร์และปรับ docker-compose

1. คัดลอกโฟลเดอร์ `ml-scheduler/` ทั้งหมดไปไว้ข้าง ๆ `docker-compose.yml` หลักของโปรเจกต์
2. เปิด `docker-compose.snippet.yml` แล้วคัดลอก block `services: ml-scheduler:` **และ** `risk-listener:`
   ไปวางใน `docker-compose.yml` หลัก (ปรับ network/volume ให้ตรงกับของจริงในระบบ)
3. ตรวจสอบว่า `DATABASE_URL` ชี้ไปที่ service ของ Postgres ในระบบถูกต้อง (ปกติคือชื่อ service เช่น `db` ไม่ใช่ `localhost`)
4. **สำคัญ:** `risk-listener` ต้อง mount volume `ml_models` **ตัวเดียวกัน** กับ `ml-scheduler`
   ไม่งั้นจะหาไฟล์ `.joblib` ไม่เจอ

### 3. Build และ start (ลำดับห้ามสลับ)

```bash
docker compose build ml-scheduler          # build ครั้งเดียว ใช้ image เดียวกันทั้ง 2 service
docker compose up -d ml-scheduler          # ขึ้นตัวเดิมก่อน เช็ค log ว่าปกติหลังแก้ import
docker compose logs -f ml-scheduler

docker compose up -d risk-listener         # ค่อยขึ้นตัวใหม่
docker compose logs -f risk-listener       # ควรเห็น "LISTEN new_complaint_channel — พร้อมรับ event แล้ว"
```

รายละเอียดการทดสอบ end-to-end และวิธี rollback ดูที่ `README_DEPLOY.md`

## การตั้งเวลา (เฉพาะ ml-scheduler)

ไฟล์ `crontab` ตั้งไว้ที่ **ทุกวันอาทิตย์ เวลา 02:00** ซึ่งเท่ากับ "ทุก 7 วัน"
ถ้าอยากเปลี่ยนวัน/เวลา แก้บรรทัดนี้ในไฟล์ `crontab`:

```
0 2 * * 0 root /app/scripts/run_training.sh >> /app/logs/cron.log 2>&1
```

รูปแบบ: `นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์`
เช่น อยากรันทุกวันจันทร์ 03:00 → เปลี่ยนเป็น `0 3 * * 1`

หลังแก้ไฟล์ crontab ต้อง rebuild image ใหม่ (`docker compose build ml-scheduler`)
เพราะไฟล์นี้ถูก copy เข้า image ตอน build (ใช้ image เดียวกับ `risk-listener` ด้วย ต้อง rebuild ทั้งคู่)

## การทดสอบรันทันที (ไม่ต้องรอ cron / ไม่ต้องรอ complaint ใหม่จริง)

**ทดสอบ batch training (ของเดิม):**
```bash
docker exec -it kaifong_ml_scheduler /app/scripts/run_training.sh
```
หรือดู log แบบ real-time:
```bash
docker logs -f kaifong_ml_scheduler
```
Log แต่ละรอบจะถูกเก็บแยกไฟล์ที่ `/app/logs/retrain_<timestamp>.log`
ภายใน container (เก็บย้อนหลังไว้ 20 ไฟล์ล่าสุด ที่เหลือจะลบอัตโนมัติ)

**ทดสอบ event-driven scoring เคสเดียว (ของใหม่) โดยไม่ต้อง insert complaint จริง:**
```bash
docker exec -it kaifong_risk_listener \
  python3 /app/scripts/score_new_complaint.py <complaint_id> <tenant_id> <tenant_code>
```
จะ print ผล JSON (`risk_score`, `risk_tier`, `shap_top_factors`) ออกมาทันที และเขียนลง
`complaint_risk_log` เหมือนตอนที่ listener เรียกเองจริง

**ทดสอบแบบ end-to-end (ผ่าน trigger จริง):** ดูขั้นตอนใน `README_DEPLOY.md` (Step 6)

## จุดที่แก้จากไฟล์ต้นฉบับ

- `train_cluster_model.py` และ `train_risk_model.py`: แก้ `DATABASE_URL = ""`
  เป็น `DATABASE_URL = os.environ.get("DATABASE_URL", "")` เพราะของเดิม hardcode
  เป็นค่าว่าง ถ้าไม่แก้ job จะ connect DB ไม่ได้ทุกครั้งที่รันใน container นี้
- `train_risk_model.py`: ย้าย feature engineering functions (`clean_raw_data`, `risk_tier`,
  `add_time_features`, `apply_hist_encoding`, `add_static_features`, `build_xy` ฯลฯ) ออกไปไว้ที่
  `risk_features.py` แทน เพื่อให้ `score_new_complaint.py` และ `listener.py` เรียกใช้ logic
  เดียวกันเป๊ะๆ กับตอน train (ป้องกัน bug แบบ "คะแนนไม่ตรงกัน" เพราะ copy-paste แล้วลืมซิงค์)

## Environment variables ที่ปรับได้ (ใน docker-compose)

| ตัวแปร | ใช้กับ | ค่า default |
|---|---|---|
| `DATABASE_URL` | ทุก service | (ต้องตั้งเอง) |
| `CLUSTER_MAX_K` | cluster | 6 |
| `CLUSTER_PCA_COMPONENTS` | cluster | 2 |
| `RISK_ACCEPT_ROC_AUC` | risk (train) | 0.75 |
| `RISK_MAX_RETRAIN_ROUNDS` | risk (train) | 3 |
| `RISK_TOP_N_FACTORS` | risk (train + score) | 5 |
| `RISK_MODEL_DIR` | risk (train + score + listener) | /app/models |
| `DASHBOARD_REFRESH_API` | risk (train) | (ว่าง = ข้ามการเรียก webhook) |

## สถาปัตยกรรมโดยรวม

```
Complaint ใหม่เข้ามา (ผ่าน Next.js app)
        │
        ├─→ Postgres trigger ยิง NOTIFY ────→ risk-listener (ฟังตลอด 24/7)
        │                                          │
        │                                          ├─ โหลด .joblib ที่ active จาก volume ml_models
        │                                          ├─ predict + SHAP เฉพาะเคสนี้
        │                                          └─ เขียนผลลง complaint_risk_log ทันที
        │
        └─→ (รอถึงรอบ) ทุกวันอาทิตย์ 02:00
                    │
              ml-scheduler (cron)
                    ├─ เทรนโมเดลใหม่จากข้อมูลทั้งหมด
                    ├─ ถ้าดีกว่าโมเดลเดิม → promote เป็น active (model_registry)
                    ├─ save .joblib ใหม่ลง volume ml_models
                    └─ batch score เคสที่เปิดอยู่ทั้งหมดซ้ำ (เขียนทับคะแนนให้แม่นขึ้น)
```

**คะแนนจาก `risk-listener` เป็น "ประมาณการเร็ว"** ด้วยโมเดลตัวล่าสุดที่มีอยู่ ณ ขณะนั้น
พอถึงรอบ batch ครบ 7 วัน คะแนนจะถูกคำนวณซ้ำด้วยโมเดลที่อาจแม่นขึ้น (ถ้ามีการ promote โมเดลใหม่)
— ถ้า `risk-listener` ล่มไปเลย ระบบก็ไม่เสีย เพราะ batch ยัง score เคสที่เปิดอยู่ทั้งหมดทุกสัปดาห์อยู่ดี
