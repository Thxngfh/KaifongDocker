# ML Scheduler (รันโมเดล cluster + risk ทุก 7 วัน)

Container แยกต่างหาก (`ml-scheduler`) ที่รัน `train_cluster_model.py` และ
`train_risk_model.py` ตามลำดับ ทุก 7 วัน ผ่าน cron ภายใน container เอง

## โครงสร้างไฟล์

```
ml-scheduler/
├── Dockerfile                    # build image พร้อม cron + dependencies
├── entrypoint.sh                 # ติดตั้ง crontab แล้ว start cron
├── crontab                       # กำหนดตารางเวลา (ทุกวันอาทิตย์ 02:00)
├── run_training.sh               # สคริปต์ที่ cron เรียก รันทั้ง 2 โมเดลตามลำดับ + log
├── requirements.txt              # dependencies ของทั้ง 2 สคริปต์
├── train_cluster_model.py        # (แก้ให้อ่าน DATABASE_URL จาก env แล้ว)
├── train_risk_model.py           # (แก้ให้อ่าน DATABASE_URL จาก env แล้ว)
└── docker-compose.snippet.yml    # ตัวอย่าง service ที่ต้องเพิ่มใน docker-compose หลัก
```

## วิธีติดตั้งเข้ากับ KaifongDocker

1. คัดลอกโฟลเดอร์ `ml-scheduler/` ทั้งหมดไปไว้ข้าง ๆ `docker-compose.yml` หลักของโปรเจกต์
2. เปิด `docker-compose.snippet.yml` แล้วคัดลอก block `services: ml-scheduler:`
   ไปวางใน `docker-compose.yml` หลัก (ปรับ network/volume ให้ตรงกับของจริงในระบบ)
3. ตรวจสอบว่า `DATABASE_URL` ชี้ไปที่ service ของ Postgres ในระบบถูกต้อง
   (ปกติคือชื่อ service เช่น `db` ไม่ใช่ `localhost`)
4. Build และ start:
   ```bash
   docker compose build ml-scheduler
   docker compose up -d ml-scheduler
   ```

## การตั้งเวลา

ไฟล์ `crontab` ตั้งไว้ที่ **ทุกวันอาทิตย์ เวลา 02:00** ซึ่งเท่ากับ "ทุก 7 วัน"
ถ้าอยากเปลี่ยนวัน/เวลา แก้บรรทัดนี้ในไฟล์ `crontab`:

```
0 2 * * 0 root /app/scripts/run_training.sh >> /app/logs/cron.log 2>&1
```

รูปแบบ: `นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์`
เช่น อยากรันทุกวันจันทร์ 03:00 → เปลี่ยนเป็น `0 3 * * 1`

หลังแก้ไฟล์ crontab ต้อง rebuild image ใหม่ (`docker compose build ml-scheduler`)
เพราะไฟล์นี้ถูก copy เข้า image ตอน build

## การทดสอบรันทันที (ไม่ต้องรอ cron)

```bash
docker exec -it kaifong_ml_scheduler /app/scripts/run_training.sh
```

หรือดู log แบบ real-time:
```bash
docker logs -f kaifong_ml_scheduler
```

Log แต่ละรอบจะถูกเก็บแยกไฟล์ที่ `/app/logs/retrain_<timestamp>.log`
ภายใน container (เก็บย้อนหลังไว้ 20 ไฟล์ล่าสุด ที่เหลือจะลบอัตโนมัติ)

## จุดที่แก้จากไฟล์ต้นฉบับ

- `train_cluster_model.py` และ `train_risk_model.py`: แก้ `DATABASE_URL = ""`
  เป็น `DATABASE_URL = os.environ.get("DATABASE_URL", "")` เพราะของเดิม hardcode
  เป็นค่าว่าง ถ้าไม่แก้ job จะ connect DB ไม่ได้ทุกครั้งที่รันใน container นี้

## Environment variables ที่ปรับได้ (ใน docker-compose)

| ตัวแปร | ใช้กับ | ค่า default |
|---|---|---|
| `DATABASE_URL` | ทั้งคู่ | (ต้องตั้งเอง) |
| `CLUSTER_MAX_K` | cluster | 6 |
| `CLUSTER_PCA_COMPONENTS` | cluster | 2 |
| `RISK_ACCEPT_ROC_AUC` | risk | 0.75 |
| `RISK_MAX_RETRAIN_ROUNDS` | risk | 3 |
| `RISK_TOP_N_FACTORS` | risk | 5 |
| `RISK_MODEL_DIR` | risk | /app/models |
| `DASHBOARD_REFRESH_API` | risk | (ว่าง = ข้าม webhook) |
