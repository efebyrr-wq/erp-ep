# Manual Deployment Commands

## Prerequisites
- AWS CLI installed and configured (`aws configure`)
- Node.js 18+ installed
- Git repository pushed to GitHub

---

## 🎨 Frontend Deployment (Amplify)

### Option 1: Push to GitHub (Auto-deploys via Amplify)
```bash
git add .
git commit -m "Deploy: Frontend updates"
git push origin main
# Amplify will automatically detect and deploy
```

### Option 2: Build Locally and Test
```bash
cd frontend
npm install
VITE_API_BASE_URL=https://d31tialuhzl449.cloudfront.net npm run build
# Test the build in frontend/dist
```

---

## 🔧 Backend Deployment (Elastic Beanstalk)

### Option 1: Manual ZIP Upload (Easiest)

```bash
# Navigate to backend
cd backend

# Install dependencies and build
npm install
npm run build

# Create deployment package
if [ -f package-lock.json ]; then
  zip -r erp-backend-deploy.zip dist/ package.json package-lock.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
else
  zip -r erp-backend-deploy.zip dist/ package.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
fi

echo "✅ Package created: erp-backend-deploy.zip"
echo "📤 Now upload this file via AWS Elastic Beanstalk Console:"
echo "   1. Go to: https://console.aws.amazon.com/elasticbeanstalk"
echo "   2. Select environment: Deployment-erp-env-v4"
echo "   3. Click 'Upload and deploy'"
echo "   4. Select erp-backend-deploy.zip"
```

### Option 2: Using AWS CLI

```bash
# Set your AWS region and bucket
export AWS_REGION=eu-north-1
export S3_BUCKET=elasticbeanstalk-eu-north-1-717036606024
export EB_APP_NAME=deployment-erp
export EB_ENV_NAME=Deployment-erp-env-v4

# Navigate to backend
cd backend

# Build
npm install
npm run build

# Create package
if [ -f package-lock.json ]; then
  zip -r erp-backend-deploy.zip dist/ package.json package-lock.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
else
  zip -r erp-backend-deploy.zip dist/ package.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
fi

# Upload to S3
S3_KEY="erp-backend-deploy-$(date +%Y%m%d-%H%M%S).zip"
aws s3 cp erp-backend-deploy.zip s3://$S3_BUCKET/$S3_KEY --region $AWS_REGION

# Create EB version
VERSION_LABEL="manual-$(date +%Y%m%d-%H%M%S)"
aws elasticbeanstalk create-application-version \
  --region $AWS_REGION \
  --application-name "$EB_APP_NAME" \
  --version-label "$VERSION_LABEL" \
  --source-bundle S3Bucket="$S3_BUCKET",S3Key="$S3_KEY"

# Deploy
aws elasticbeanstalk update-environment \
  --region $AWS_REGION \
  --environment-name "$EB_ENV_NAME" \
  --version-label "$VERSION_LABEL"

echo "✅ Deployment initiated! Check AWS Console for status."
```

### Option 3: Using EB CLI

```bash
# Install EB CLI (if not installed)
pip install awsebcli

# Navigate to backend
cd backend

# Initialize (if not already done)
eb init -p node.js-18 -r eu-north-1 deployment-erp

# Deploy
eb deploy Deployment-erp-env-v4
```

---

## 🔄 Full Stack Deployment (Both)

### Quick Script
```bash
#!/bin/bash
set -e

echo "🚀 Starting full stack deployment..."

# Backend
echo "📦 Building backend..."
cd backend
npm install
npm run build

if [ -f package-lock.json ]; then
  zip -r ../erp-backend-deploy.zip dist/ package.json package-lock.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
else
  zip -r ../erp-backend-deploy.zip dist/ package.json \
    -x "*.map" "*.tsbuildinfo" "node_modules/*" "src/*" "*.ts"
fi
echo "✅ Backend package: erp-backend-deploy.zip"
echo "📤 Upload to Elastic Beanstalk Console"

# Frontend
echo "🎨 Building frontend..."
cd ../frontend
npm install
VITE_API_BASE_URL=https://d31tialuhzl449.cloudfront.net npm run build
echo "✅ Frontend build: frontend/dist"

# Push to GitHub (triggers Amplify)
cd ..
echo "📤 Push to GitHub to deploy frontend:"
echo "   git add ."
echo "   git commit -m 'Deploy: Full stack update'"
echo "   git push origin main"

echo "✅ Deployment preparation complete!"
```

---

## 🔍 Verify Deployment

### Check Backend
```bash
# Test endpoint
curl https://d31tialuhzl449.cloudfront.net/health

# Check EB status
aws elasticbeanstalk describe-environments \
  --region eu-north-1 \
  --environment-names Deployment-erp-env-v4 \
  --query 'Environments[0].[Status,Health,VersionLabel]' \
  --output table
```

### Check Frontend
- Visit: https://main.d1054i3y445g1d.amplifyapp.com
- Or: https://staging.d1054i3y445g1d.amplifyapp.com

---

## 🛠️ Troubleshooting

### Backend Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# View EB logs
aws elasticbeanstalk request-environment-info \
  --region eu-north-1 \
  --environment-name Deployment-erp-env-v4 \
  --info-type tail

# Or via EB CLI
eb logs Deployment-erp-env-v4
```

### Frontend Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Environment Variables

**Elastic Beanstalk** (set in AWS Console):
- `CORS_ORIGINS`
- `DATABASE_URL`
- `FRONTEND_URLS`

**Amplify** (set in `amplify.yml`):
- `VITE_API_BASE_URL: https://d31tialuhzl449.cloudfront.net`



