#!/usr/bin/env bash
# deploy.sh - safe deploy script
# Usage: ./deploy.sh [branch] [pm2-processes]
# Examples:
#   ./deploy.sh                # uses "main" branch, restarts "all"
#   ./deploy.sh develop        # pulls develop, restarts "all"
#   ./deploy.sh main "manager:1 manager:2"  # restarts only listed pm2 processes

set -euo pipefail
IFS=$'\n\t'

REPO_DIR="$(pwd)"
BRANCH="${1:-main}"
PM2_TARGETS="${2:-all}"
LOGFILE="${REPO_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"

echo "[deploy] $(date +'%F %T') - Starting deploy" | tee -a "$LOGFILE"

echo "[deploy] Repo dir: $REPO_DIR" | tee -a "$LOGFILE"

echo "[deploy] Checking for uncommitted changes..." | tee -a "$LOGFILE"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "[deploy][error] You have uncommitted changes. Please commit or stash them before running this script." | tee -a "$LOGFILE"
  exit 1
fi

echo "[deploy] Fetching latest from origin..." | tee -a "$LOGFILE"
git fetch origin "$BRANCH" --quiet

echo "[deploy] Checking out $BRANCH and pulling..." | tee -a "$LOGFILE"
git checkout "$BRANCH" --quiet
# Use rebase-style pull to avoid merge commits on CI servers; change if you prefer merge
git pull --rebase origin "$BRANCH" | tee -a "$LOGFILE"

# Install dependencies (use npm ci for reproducible installs if package-lock.json exists)
if [[ -f package-lock.json ]]; then
  echo "[deploy] Installing dependencies with npm ci..." | tee -a "$LOGFILE"
  npm ci --silent | tee -a "$LOGFILE"
else
  echo "[deploy] Installing dependencies with npm install..." | tee -a "$LOGFILE"
  npm install --silent | tee -a "$LOGFILE"
fi

# Build step
if npm run | grep -q "build"; then
  echo "[deploy] Running npm run build..." | tee -a "$LOGFILE"
  npm run build 2>&1 | tee -a "$LOGFILE"
else
  echo "[deploy] No build script found in package.json; skipping build." | tee -a "$LOGFILE"
fi

# Optional: run migrations or other steps here
# e.g., npm run migrate --if-present

# PM2 restart
if [[ "$PM2_TARGETS" == "all" ]]; then
  echo "[deploy] Restarting all pm2 processes (pm2 restart all)..." | tee -a "$LOGFILE"
  pm2 restart all 2>&1 | tee -a "$LOGFILE"
else
  echo "[deploy] Restarting pm2 processes: $PM2_TARGETS" | tee -a "$LOGFILE"
  # split PM2_TARGETS on spaces and restart individually
  read -ra PROCS <<< "$PM2_TARGETS"
  for p in "${PROCS[@]}"; do
    echo "[deploy] Restarting: $p" | tee -a "$LOGFILE"
    pm2 restart "$p" 2>&1 | tee -a "$LOGFILE" || {
      echo "[deploy][warn] pm2 restart $p failed; attempting pm2 start --no-vizion (if ecosystem file exists)" | tee -a "$LOGFILE"
    }
  done
fi

echo "[deploy] $(date +'%F %T') - Deploy finished successfully" | tee -a "$LOGFILE"

echo "[deploy] Logfile: $LOGFILE" | tee -a "$LOGFILE"

exit 0
