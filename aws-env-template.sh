#!/bin/bash

# AWS Environment Variables Template
# Copy this file and fill in your actual values
# Then source it: source aws-env.sh

# RDS Database Configuration
export DB_HOST="your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com"
export DB_PORT="5432"
export DB_USERNAME="postgres"
export DB_PASSWORD="your-strong-password"
export DB_NAME="erp_2025"
export DB_SCHEMA="public"

# Backend Configuration
export PORT="3000"
export NODE_ENV="production"

# Frontend Configuration
export VITE_API_BASE_URL="https://your-backend-url.elasticbeanstalk.com"

# AWS Configuration
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="your-account-id"

# Elastic Beanstalk Configuration
export EB_APP_NAME="erp-2025-backend"
export EB_ENV_NAME="erp-2025-backend-env"

# ECS Configuration (if using)
export ECS_CLUSTER_NAME="erp-2025-cluster"
export ECR_BACKEND_REPO="erp-2025-backend"
export ECR_FRONTEND_REPO="erp-2025-frontend"

echo "Environment variables loaded!"
echo "Make sure to update all values with your actual AWS resources."








