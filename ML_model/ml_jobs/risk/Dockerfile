FROM python:3.11-slim

# xgboost / lightgbm need libgomp at runtime on slim images
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY train_risk_model.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Model artifacts saved here — mount as a volume in docker-compose to persist across restarts
RUN mkdir -p /app/models

CMD ["./entrypoint.sh"]
