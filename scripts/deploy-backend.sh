#!/bin/bash
# Quick script to deploy backend to Elastic Beanstalk

set -e

cd /Users/efebayar/Documents/erp_2025/backend

echo "🔨 Building backend..."
npm run build

echo "📦 Creating deployment package..."
zip -r erp-backend-deploy.zip dist/ package.json package-lock.json \
  -x "*.map" "*.tsbuildinfo" "node_modules/*"

S3_KEY="erp-backend-deploy-$(date +%Y%m%d-%H%M%S).zip"
echo "📤 Uploading to S3: $S3_KEY"
aws s3 cp erp-backend-deploy.zip \
  s3://elasticbeanstalk-eu-north-1-717036606024/$S3_KEY \
  --region eu-north-1

VERSION_LABEL="deploy-$(date +%Y%m%d-%H%M%S)"
echo "🚀 Creating application version: $VERSION_LABEL"
aws elasticbeanstalk create-application-version \
  --region eu-north-1 \
  --application-name "deployment-erp" \
  --version-label "$VERSION_LABEL" \
  --source-bundle S3Bucket="elasticbeanstalk-eu-north-1-717036606024",S3Key="$S3_KEY" \
  --description "Deployment $(date)" \
  --output text --query 'ApplicationVersion.VersionLabel'

echo "📡 Deploying to environment..."
aws elasticbeanstalk update-environment \
  --region eu-north-1 \
  --environment-name "Deployment-erp-env-v4" \
  --version-label "$VERSION_LABEL" \
  --output text --query 'EnvironmentId'

echo "✅ Deployment initiated! Monitor with:"
echo "   aws elasticbeanstalk describe-environments --region eu-north-1 --environment-names 'Deployment-erp-env-v4' --query 'Environments[0].[Status,Health]' --output table"
