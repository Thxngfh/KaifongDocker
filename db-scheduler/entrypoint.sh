#!/bin/sh
set -e
echo "[db-scheduler] Starting cron for real-time summary refresh..."
# -f = foreground (ให้ container ไม่ตาย), -l 2 = log level ปานกลาง
exec crond -f -l 2
