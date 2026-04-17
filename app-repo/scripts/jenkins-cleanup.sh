#!/bin/bash
set -euo pipefail

# ============================================
# Jenkins Cache Cleanup Script
# ============================================
# Run manually or via cron on the Jenkins EC2
# Clears workspace, builds, logs, and tmp
# Usage: ./jenkins-cleanup.sh

echo "[$(date)] Starting Jenkins cache cleanup..."

# Check if Jenkins container is running
if ! docker ps | grep -q jenkins; then
  echo "❌ Jenkins container is not running!"
  exit 1
fi

echo "🧹 Cleaning workspace..."
docker exec -u 0 jenkins bash -c "rm -rf /var/jenkins_home/workspace/*"

echo "🧹 Cleaning build artifacts..."
docker exec -u 0 jenkins bash -c "rm -rf /var/jenkins_home/jobs/*/builds/*/archive"

echo "🧹 Cleaning logs..."
docker exec -u 0 jenkins bash -c "rm -rf /var/jenkins_home/logs/*"

echo "🧹 Cleaning tmp..."
docker exec -u 0 jenkins bash -c "rm -rf /var/jenkins_home/tmp/* /tmp/*"

echo "🔄 Restarting Jenkins container..."
docker restart jenkins

echo "⏳ Waiting for Jenkins to be ready..."
sleep 30

# Verify Jenkins is back up
if docker ps | grep -q jenkins; then
  echo "✅ Jenkins is running."
else
  echo "❌ Jenkins failed to restart!"
  exit 1
fi

echo "[$(date)] ✅ Jenkins cache cleanup completed."
