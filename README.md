# Kaifong Docker Setup

### Project Structure

```text
Kaifongproject/
├── docker-compose.yml
├── kaifongai/
│   └── Dockerfile
├── kaifongliff/
│   └── Dockerfile
└── db/
    ├── init/
    │   └── create-table.sql
    ├── migrations/
    │   ├── member_approval_status.sql
    │   └── production_migration.sql
    ├── seed/
    │   └── insert.sql
    └── dumps/   ❌ (ไม่ใช้ใน repo)
```
## Database Dumps (External Storage)

Database backup files are stored externally to keep the repository lightweight.

📦 Google Drive:
https://drive.google.com/drive/folders/156CQtFrefy9GVsojv9JfrTOQlAEyPHKc

⚠️ These files are not included in this repository.

How to restore:
Run from project root directory

psql -d kaifong_db -f db/dumps/complaint_system_db_v002.sql

Note: Database dump file is provided by senior developer and should not be renamed.

### วิธีการใช้งาน

1. Clone Repository

```bash
git clone https://github.com/Thxngfh/KaifongDocker.git
cd KaifongDocker
```

2. Build และ Run Container

```bash
docker compose up --build
```

### Database Setup (PostgreSQL)

```bash
# 1. สร้าง database (ถ้ายังไม่มี)
createdb kaifong_db

# 2. สร้าง table structure
psql -d kaifong_db -f db/init/create-table.sql

# 3. run migrations
psql -d kaifong_db -f db/migrations/member_approval_status.sql
psql -d kaifong_db -f db/migrations/production_migration.sql

# 4. insert seed data
psql -d kaifong_db -f db/seed/insert.sql
```
### Services

| Service      | URL                   |
| ------------ | --------------------- |
| Kaifong LIFF | http://localhost:3000 |
| Kaifong AI   | http://localhost:3001 |
