#!/usr/bin/env bash

echo "[deploy] Pulling latest code..."
git pull origin main

echo "[deploy] Building project..."
npm run build

echo "[deploy] Restarting all PM2 processes..."
pm2 restart all

echo "[deploy] Deploy finished ✅"
