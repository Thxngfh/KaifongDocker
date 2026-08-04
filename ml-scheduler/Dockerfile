FROM python:3.11-slim

# cron + build deps needed by xgboost/lightgbm/psycopg2 wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        cron \
        libgomp1 \
        gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY train_cluster_model.py  /app/scripts/train_cluster_model.py
COPY train_risk_model.py     /app/scripts/train_risk_model.py
COPY risk_features.py        /app/scripts/risk_features.py
COPY score_new_complaint.py  /app/scripts/score_new_complaint.py
COPY listener.py             /app/scripts/listener.py
COPY run_training.sh         /app/scripts/run_training.sh
COPY crontab                 /app/scripts/crontab
COPY entrypoint.sh            /app/entrypoint.sh

RUN chmod +x /app/scripts/run_training.sh /app/entrypoint.sh \
    && chmod 0644 /app/scripts/crontab \
    && mkdir -p /app/models /app/logs

# PYTHONPATH ให้ทุกสคริปต์ import risk_features.py / score_new_complaint.py กันได้
# ไม่ว่าจะถูกเรียกจาก entrypoint (cron) หรือ command override (listener)
ENV PYTHONPATH=/app/scripts

ENTRYPOINT ["/app/entrypoint.sh"]