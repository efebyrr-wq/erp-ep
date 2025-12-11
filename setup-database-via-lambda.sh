#!/bin/bash
# Script to deploy Lambda function and run database setup
# Alternative to CloudShell

echo "📦 Creating Lambda deployment package..."

cd lambda-db-setup
npm install --production
zip -r ../lambda-db-setup.zip .
cd ..

echo "✅ Lambda package created: lambda-db-setup.zip"
echo ""
echo "📋 Next steps:"
echo "1. Create Lambda function in AWS Console (eu-north-1)"
echo "2. Upload lambda-db-setup.zip"
echo "3. Set environment variables:"
echo "   - DB_HOST=erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com"
echo "   - DB_NAME=erp-2025-db"
echo "   - DB_USER=postgres"
echo "   - DB_PASSWORD=gevnon-6Gihna-hentom"
echo "4. Set VPC configuration to same VPC as RDS"
echo "5. Set timeout to 5 minutes"
echo "6. Invoke the function"
echo ""
echo "Or use AWS CLI commands below:"

cat << 'EOF'

# Create Lambda function
aws lambda create-function \
  --region eu-north-1 \
  --function-name erp-db-setup \
  --runtime nodejs18.x \
  --role arn:aws:iam::717036606024:role/lambda-vpc-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda-db-setup.zip \
  --timeout 300 \
  --vpc-config SubnetIds=subnet-06950276212e67908,subnet-0259a5f3ebb48d20c,SecurityGroupIds=sg-0c1ffc643857abaea \
  --environment Variables="{DB_HOST=erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com,DB_NAME=erp-2025-db,DB_USER=postgres,DB_PASSWORD=gevnon-6Gihna-hentom}"

# Invoke Lambda
aws lambda invoke \
  --region eu-north-1 \
  --function-name erp-db-setup \
  --payload '{}' \
  response.json

EOF


