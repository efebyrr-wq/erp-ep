#!/bin/bash
# Script to create and attach IAM role for Amplify

set -e

APP_ID="d1054i3y445g1d"
REGION="eu-north-1"
ROLE_NAME="amplify-service-role"

echo "🔧 Setting up IAM role for Amplify..."

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
    echo "✅ IAM role already exists: $ROLE_NAME"
else
    echo "📝 Creating IAM role: $ROLE_NAME"
    
    # Create trust policy for Amplify
    cat > /tmp/amplify-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create the role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/amplify-trust-policy.json \
        --description "Service role for AWS Amplify" \
        --output json

    echo "✅ IAM role created"
    
    # Attach Amplify managed policy
    echo "📎 Attaching Amplify managed policies..."
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmplifyBackendDeployFullAccess \
        --output json || echo "⚠️  Could not attach AmplifyBackendDeployFullAccess (may not be needed)"
    
    # Wait for role to be available
    echo "⏳ Waiting for role to be available..."
    sleep 5
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "📋 Role ARN: $ROLE_ARN"

# Update Amplify app with the role
echo "🔗 Attaching IAM role to Amplify app..."
aws amplify update-app \
    --app-id "$APP_ID" \
    --region "$REGION" \
    --iam-service-role-arn "$ROLE_ARN" \
    --output json

echo ""
echo "✅ IAM role configured!"
echo ""
echo "🚀 You can now trigger a new build:"
echo "   aws amplify start-job --app-id $APP_ID --branch-name staging --job-type RELEASE --region $REGION"



