#!/bin/bash

# Start Elastic Beanstalk Deployment
# This script will guide you through the deployment process

export PATH="$HOME/Library/Python/3.9/bin:$PATH"

cd /Users/efebayar/Documents/erp_2025/backend

echo "🚀 Starting Elastic Beanstalk Deployment"
echo "=========================================="
echo ""
echo "Step 1: Initializing Elastic Beanstalk..."
echo "   This will prompt you for a few selections."
echo ""
echo "   Run this command:"
echo "   eb init -p node.js-18 -r eu-north-1 erp-2025-backend"
echo ""
echo "   When prompted, select:"
echo "   - Region: eu-north-1 (or press Enter)"
echo "   - Application name: erp-2025-backend (or press Enter)"
echo "   - Platform: Node.js (auto-selected)"
echo "   - Platform version: Node.js 18 (or latest)"
echo ""
read -p "Press Enter after you've run 'eb init'..."

echo ""
echo "Step 2: Creating environment (this takes 5-10 minutes)..."
echo "   Run: eb create erp-2025-backend-env"
echo ""
read -p "Press Enter after environment is created..."

echo ""
echo "Step 3: Setting environment variables..."
eb setenv \
  DB_HOST=erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USERNAME=postgres \
  DB_PASSWORD=gevnon-6Gihna-hentom \
  DB_NAME=erp_2025 \
  DB_SCHEMA=public \
  PORT=8080 \
  NODE_ENV=production

echo ""
echo "Step 4: Deploying (this takes 3-5 minutes)..."
eb deploy

echo ""
echo "Step 5: Getting your backend URL..."
eb status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next: Update RDS security group to allow Elastic Beanstalk"
echo "See EB_DEPLOYMENT_STEPS.md for details"





