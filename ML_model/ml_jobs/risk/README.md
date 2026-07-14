# Risk Prediction Training Job — วิธีติดตั้งเข้า KaifongDocker

## 1. วางไฟล์

```
KaifongDocker/
└── ml_jobs/
    ├── cluster/        (ตัวเดิมที่ทำไปก่อนหน้านี้)
    └── risk/
        ├── Dockerfile
        ├── requirements.txt
        ├── entrypoint.sh
        └── train_risk_model.py
```

## 2. เพิ่ม service ใน docker-compose.yml

```yaml
  ml-risk-job:
    build: ./ml_jobs/risk
    container_name: kaifong_ml_risk_job
    restart: unless-stopped
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://kaifong:kaifong1234@db:5432/kaifongdb
      RETRAIN_INTERVAL_SECONDS: "604800"     # 7 วัน
      RUN_ON_START: "true"
      RISK_ACCEPT_ROC_AUC: "0.75"            # เกณฑ์ validation AUC ที่ยอมรับ (เท่าเดิมจาก notebook)
      RISK_MAX_RETRAIN_ROUNDS: "3"
      # DASHBOARD_REFRESH_API: "https://yourapp.com/api/dashboard/refresh"   # ใส่ถ้ามี endpoint จริง ไม่ใส่ก็ข้ามได้
    volumes:
      - ml_risk_models:/app/models   # เก็บไฟล์ .joblib ไว้ข้าม container restart

volumes:
  ml_risk_models:
```

(อย่าลืมแก้ service name `db` ให้ตรงกับ docker-compose.yml จริงของคุณ เหมือนที่เตือนไว้ในตัว cluster job)

## 3. รัน

```bash
docker compose up --build -d ml-risk-job
docker compose logs -f ml-risk-job
```

รอบแรกจะใช้เวลานานกว่า cluster job มาก (เทรน 6 โมเดล x สูงสุด 3 รอบ retrain + คำนวณ SHAP ต่อเคสเปิดทั้งหมด)
ขึ้นกับจำนวนข้อมูล อาจใช้เวลาหลักนาทีถึงหลักสิบนาที

## ⚠️ สิ่งที่พบระหว่างแปลงโค้ด — ควรรู้ก่อนใช้งานจริง

**1. schema มีการ "เพิ่มกลับ" คอลัมน์ที่เคยบอกว่าตัดออกแล้ว**
ตอนดู `model_output_schema.sql` ครั้งแรก คอมเมนต์บอกว่า "ตัด `complaint_risk_explanations`/SHAP ออกแล้ว
ไม่จำเป็นต่อการทำงานของโมเดล" แต่ notebook `v8` นี้กลับมีขั้นตอนคำนวณ SHAP per-case (`shap_top_factors`)
และ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS shap_top_factors JSONB` เพื่อเก็บกลับเข้า `complaint_risk_log`
เหมือนกัน — สคริปต์นี้ทำตาม notebook ล่าสุด (v8) คือ**เก็บ SHAP กลับเข้าไปด้วย** ถ้าไม่ต้องการ SHAP จริงๆ
(ลด compute + ขนาด JSONB) บอกได้ ตัดส่วน `score_open_complaints()` เฉพาะ SHAP ออกให้ได้

**2. ตาราง `sla_tracking` โหลดมาเฉย ๆ ไม่ได้ใช้จริง**
ใน notebook เดิมมีการ query ตาราง `sla_tracking` และแปลง type ไว้ แต่ไม่เคยถูกใช้ต่อใน feature ใดๆเลย
(dead code) — script นี้ตัดการ query ตารางนี้ออกให้แล้ว เพื่อลดเวลารันและภาระ database โดยไม่กระทบผลลัพธ์

**3. `DASHBOARD_REFRESH_API` เดิมเป็น placeholder URL** (`https://yourapp.com/api/dashboard/refresh`)
ในสคริปต์นี้เปลี่ยนเป็น env var ที่ปล่อยว่างได้ — ถ้าไม่ตั้งค่า จะข้ามการเรียก webhook นี้ไปเฉย ๆ (ไม่ error)
ถ้ามี endpoint จริงให้ dashboard คุณ ใส่ env var `DASHBOARD_REFRESH_API` ใน docker-compose ได้เลย

**4. Query ยังไม่กรอง `tenant_id`** — เหมือนกับ cluster job ก่อนหน้า ตอนนี้ query `complaints` ทุก
tenant มาปนกันหมด ตรงกับที่คุยไว้ก่อนหน้าว่ายังมี tenant เดียว (BMA) จึงยังไม่กระทบ แต่ถ้าจะขยายหลาย tenant
ต้องแก้ทั้ง schema และ query ส่วนนี้ (พร้อมกับ cluster job) ก่อน

**5. ใช้เวลานาน + ใช้ CPU/RAM เยอะ** — retrain loop เทรน 6 โมเดลต่อรอบ (สูงสุด 3 รอบ = ได้ถึง 18 ครั้ง
ในกรณีเลวร้ายสุด) บน container ที่แชร์เครื่องเดียวกับ database/backend ถ้าเครื่องมี RAM จำกัด อาจต้องลด
`RISK_MAX_RETRAIN_ROUNDS` หรือรันตอนดึกที่คนใช้งานน้อย (ปรับ `RUN_ON_START: "false"` แล้วตั้งเวลาด้วยวิธีอื่น
เช่น cron ข้างนอกยิงเข้ามาแทนได้ ถ้าต้องการควบคุมเวลารันแม่นยำกว่าการนับจากตอน container start)

## Environment variables ทั้งหมด

| ตัวแปร | ค่า default | ความหมาย |
|---|---|---|
| `DATABASE_URL` | (ต้องตั้งเอง) | connection string ไปยัง database |
| `RETRAIN_INTERVAL_SECONDS` | `604800` (7 วัน) | รอบเวลาที่จะ retrain ใหม่ |
| `RUN_ON_START` | `true` | รันทันทีตอน container start หรือรอครบ interval ก่อน |
| `RISK_ACCEPT_ROC_AUC` | `0.75` | เกณฑ์ validation AUC ที่ยอมรับก่อนหยุด retrain loop |
| `RISK_MAX_RETRAIN_ROUNDS` | `3` | จำนวนรอบ retrain สูงสุด (กัน infinite loop) |
| `RISK_TOP_N_FACTORS` | `5` | จำนวนปัจจัย SHAP ที่เก็บต่อเคส |
| `RISK_MODEL_DIR` | `/app/models` | ที่เก็บไฟล์ `.joblib` |
| `DASHBOARD_REFRESH_API` | (ว่าง = ข้าม) | webhook แจ้ง dashboard เมื่อ promote โมเดลใหม่สำเร็จ |

## ทดสอบรันทันทีโดยไม่รอ interval

```bash
docker compose exec ml-risk-job python train_risk_model.py
```
