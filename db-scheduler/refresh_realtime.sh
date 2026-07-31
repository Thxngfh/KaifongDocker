#!/bin/sh
# ============================================================
# refresh_realtime.sh
# รัน refresh_realtime.sql ทุก 1-5 นาทีผ่าน cron
# ============================================================
set -e

TS() { date -u +"%Y-%m-%dT%H:%M:%S+00:00"; }

echo "[$(TS)] Refreshing real-time summary tables..."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/scripts/refresh_realtime.sql \
    && echo "[$(TS)] ✅ Refresh finished" \
    || { echo "[$(TS)] ❌ Refresh FAILED"; exit 1; }
