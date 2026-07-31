FROM postgres:16-alpine

# alpine ไม่มี cron ติดมาด้วย ต้องเพิ่มเอง (dcron = busybox cron)
RUN apk add --no-cache dcron

WORKDIR /app/scripts
COPY refresh_realtime.sql .
COPY refresh_realtime.sh .
COPY crontab /etc/crontabs/root

RUN chmod +x /app/scripts/refresh_realtime.sh \
    && mkdir -p /app/logs

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
