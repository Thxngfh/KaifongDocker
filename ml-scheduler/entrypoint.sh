#!/bin/bash
set -e

mkdir -p /app/logs
touch /app/logs/cron.log

# install the crontab
crontab /app/scripts/crontab

echo "[$(date -Iseconds)] ml-scheduler container started. Next run per crontab schedule (every 7 days)." >> /app/logs/cron.log

# uncomment to also run once immediately on container startup (handy for first deploy / testing)
# /app/scripts/run_training.sh &

# start cron in the foreground so the container stays alive,
# and tail the log so `docker logs -f <container>` shows job output
cron
tail -f /app/logs/cron.log
