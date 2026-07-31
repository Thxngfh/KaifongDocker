#!/bin/bash
# run_training.sh
# ==================================================
# Runs the weekly ML retraining pipeline:
#   1) Spatial clustering model (train_cluster_model.py)
#   2) SLA-breach risk prediction model (train_risk_model.py)
#
# Called by cron every 7 days (see /etc/cron.d/ml-retrain-cron).
# Can also be run manually inside the container to test:
#   docker exec -it <container_name> /app/scripts/run_training.sh
# ==================================================

set -uo pipefail

LOG_DIR="/app/logs"
mkdir -p "$LOG_DIR"
RUN_ID=$(date +'%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/retrain_${RUN_ID}.log"

echo "=================================================="  | tee -a "$LOG_FILE"
echo "[$(date -Iseconds)] Weekly retrain job started"        | tee -a "$LOG_FILE"
echo "=================================================="  | tee -a "$LOG_FILE"

STATUS=0

echo ""  | tee -a "$LOG_FILE"
echo "--- [1/2] Clustering model (train_cluster_model.py) ---" | tee -a "$LOG_FILE"
python3 /app/scripts/train_cluster_model.py >> "$LOG_FILE" 2>&1
CLUSTER_EXIT=$?
if [ $CLUSTER_EXIT -ne 0 ]; then
    echo "[$(date -Iseconds)] ❌ Clustering job FAILED (exit code $CLUSTER_EXIT)" | tee -a "$LOG_FILE"
    STATUS=1
else
    echo "[$(date -Iseconds)] ✅ Clustering job completed" | tee -a "$LOG_FILE"
fi

echo ""  | tee -a "$LOG_FILE"
echo "--- [2/2] Risk prediction model (train_risk_model.py) ---" | tee -a "$LOG_FILE"
python3 /app/scripts/train_risk_model.py >> "$LOG_FILE" 2>&1
RISK_EXIT=$?
if [ $RISK_EXIT -ne 0 ]; then
    echo "[$(date -Iseconds)] ❌ Risk model job FAILED (exit code $RISK_EXIT)" | tee -a "$LOG_FILE"
    STATUS=1
else
    echo "[$(date -Iseconds)] ✅ Risk model job completed" | tee -a "$LOG_FILE"
fi

echo ""  | tee -a "$LOG_FILE"
echo "=================================================="  | tee -a "$LOG_FILE"
if [ $STATUS -eq 0 ]; then
    echo "[$(date -Iseconds)] Weekly retrain job finished: ALL OK" | tee -a "$LOG_FILE"
else
    echo "[$(date -Iseconds)] Weekly retrain job finished: ONE OR MORE JOBS FAILED" | tee -a "$LOG_FILE"
fi
echo "=================================================="  | tee -a "$LOG_FILE"

# also mirror into the main cron log that `docker logs` shows
cat "$LOG_FILE"

# keep only the last 20 run logs to avoid unbounded disk growth
ls -1t "$LOG_DIR"/retrain_*.log 2>/dev/null | tail -n +21 | xargs -r rm --

exit $STATUS
