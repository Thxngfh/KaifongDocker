import { Pool } from 'pg';

// ถ้ามี DATABASE_URL (เช่น Neon บน Vercel) ให้ใช้แบบนั้น พร้อมเปิด SSL
// ถ้าไม่มี (รันบน local Docker Compose) ให้ fallback ไปใช้ DB_* fields แยกแบบเดิม
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

export default pool;