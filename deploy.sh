#!/bin/bash

# AWS Deployment Script for ERP 2025
# This script helps automate the deployment process

set -e

echo "🚀 ERP 2025 AWS Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed (for ECS deployment)
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. ECS deployment option will not be available.${NC}"
fi

# Function to deploy to Elastic Beanstalk
deploy_eb() {
    echo -e "${GREEN}Deploying to Elastic Beanstalk...${NC}"
    
    cd backend
    
    # Check if EB CLI is installed
    if ! command -v eb &> /dev/null; then
        echo -e "${YELLOW}EB CLI not found. Installing...${NC}"
        pip install awsebcli
    fi
    
    # Initialize if not already done
    if [ ! -d ".elasticbeanstalk" ]; then
        echo "Initializing Elastic Beanstalk..."
        eb init -p node.js-18 -r us-east-1 erp-2025-backend
    fi
    
    # Build the application
    echo "Building backend..."
    npm run build
    
    # Deploy
    echo "Deploying..."
    eb deploy
    
    echo -e "${GREEN}Backend deployed successfully!${NC}"
    echo "Get your backend URL with: eb status"
    
    cd ..
}

# Function to deploy to ECS
deploy_ecs() {
    echo -e "${GREEN}Deploying to ECS...${NC}"
    
    # Get AWS account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=${AWS_REGION:-us-east-1}
    
    echo "Account ID: $ACCOUNT_ID"
    echo "Region: $REGION"
    
    # Build and push backend
    echo "Building and pushing backend image..."
    cd backend
    docker build -t erp-2025-backend .
    docker tag erp-2025-backend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/erp-2025-backend:latest
    
    # Login to ECR
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
    
    # Create repository if it doesn't exist
    aws ecr describe-repositories --repository-names erp-2025-backend --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name erp-2025-backend --region $REGION
    
    # Push image
    docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/erp-2025-backend:latest
    
    cd ../frontend
    
    # Build and push frontend
    echo "Building and pushing frontend image..."
    read -p "Enter your backend API URL: " API_URL
    docker build --build-arg VITE_API_BASE_URL=$API_URL -t erp-2025-frontend .
    docker tag erp-2025-frontend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/erp-2025-frontend:latest
    
    # Create repository if it doesn't exist
    aws ecr describe-repositories --repository-names erp-2025-frontend --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name erp-2025-frontend --region $REGION
    
    # Push image
    docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/erp-2025-frontend:latest
    
    cd ..
    
    echo -e "${GREEN}Images pushed to ECR successfully!${NC}"
    echo "Next steps:"
    echo "1. Create ECS cluster and task definitions"
    echo "2. Create services with load balancers"
    echo "3. See AWS_DEPLOYMENT.md for detailed instructions"
}

# Function to build frontend
build_frontend() {
    echo -e "${GREEN}Building frontend...${NC}"
    
    cd frontend
    
    read -p "Enter your backend API URL (e.g., https://api.example.com): " API_URL
    
    if [ -z "$API_URL" ]; then
        echo -e "${YELLOW}No API URL provided. Using default.${NC}"
        API_URL="http://localhost:3000"
    fi
    
    VITE_API_BASE_URL=$API_URL npm run build
    
    echo -e "${GREEN}Frontend built successfully!${NC}"
    echo "Build output is in: frontend/dist"
    
    cd ..
}

# Main menu
echo ""
echo "Select deployment option:"
echo "1) Deploy Backend to Elastic Beanstalk"
echo "2) Build and Push Docker Images to ECR (for ECS)"
echo "3) Build Frontend Only"
echo "4) Exit"
echo ""
read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        deploy_eb
        ;;
    2)
        deploy_ecs
        ;;
    3)
        build_frontend
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Deployment process completed!${NC}"








