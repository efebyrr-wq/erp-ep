#!/bin/bash
# Complete fix for Amplify IAM role issue

set -e

APP_ID="d1054i3y445g1d"
REGION="eu-north-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔧 Creating proper Amplify service role..."

# Delete existing role if it has issues
aws iam delete-role --role-name amplify-service-role 2>/dev/null || echo "Role doesn't exist or can't be deleted"

# Wait a bit
sleep 3

# Create trust policy that includes both Amplify and CodeBuild
cat > /tmp/amplify-trust-complete.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "amplify.amazonaws.com",
          "codebuild.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name amplify-service-role \
    --assume-role-policy-document file:///tmp/amplify-trust-complete.json \
    --description "Service role for AWS Amplify builds" \
    --output json

echo "✅ Role created"

# Attach AWS managed policies
echo "📎 Attaching AWS managed policies..."
aws iam attach-role-policy \
    --role-name amplify-service-role \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify

# Wait for role to propagate
echo "⏳ Waiting for IAM changes to propagate (30 seconds)..."
sleep 30

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name amplify-service-role --query 'Role.Arn' --output text)
echo "📋 Role ARN: $ROLE_ARN"

# Update Amplify app
echo "🔗 Attaching role to Amplify app..."
aws amplify update-app \
    --app-id "$APP_ID" \
    --region "$REGION" \
    --iam-service-role-arn "$ROLE_ARN" \
    --output json

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Triggering new build..."
aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name staging \
    --job-type RELEASE \
    --region "$REGION" \
    --output json

echo ""
echo "⏳ Monitor the build at:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"



