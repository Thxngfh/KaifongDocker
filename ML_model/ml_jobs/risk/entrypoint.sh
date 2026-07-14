#!/bin/sh
set -e

INTERVAL_SECONDS=${RETRAIN_INTERVAL_SECONDS:-604800}   # default: 7 days
RUN_ON_START=${RUN_ON_START:-true}

if [ "$RUN_ON_START" = "true" ]; then
    echo "=== [entrypoint] Running risk training job immediately on startup: $(date) ==="
    python train_risk_model.py || echo "=== [entrypoint] Job failed, will retry next cycle ==="
fi

while true; do
    echo "=== [entrypoint] Sleeping for ${INTERVAL_SECONDS}s (next run: $(date -d "+${INTERVAL_SECONDS} seconds" 2>/dev/null || date)) ==="
    sleep "$INTERVAL_SECONDS"
    echo "=== [entrypoint] Running risk training job: $(date) ==="
    python train_risk_model.py || echo "=== [entrypoint] Job failed, will retry next cycle ==="
done
