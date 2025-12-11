#!/bin/bash
# Quick script to build frontend for deployment

set -e

cd /Users/efebayar/Documents/erp_2025/frontend

echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete! Output in: frontend/dist/"
echo ""
echo "📤 To deploy to Amplify:"
echo "   1. Go to AWS Amplify Console"
echo "   2. Select your app"
echo "   3. Click 'Deploy' → 'Deploy without Git provider'"
echo "   4. Upload the frontend/dist/ folder"
echo ""
echo "   OR push to Git repository for automatic deployment"

