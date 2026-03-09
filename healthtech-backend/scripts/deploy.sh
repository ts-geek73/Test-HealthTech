#!/bin/bash
# deploy.sh — pull, build, restart

set -e

echo "📥 Pulling latest..."
git pull

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "🔁 Restarting PM2..."
pm2 restart healthtech-backend

echo "✅ Deploy complete"