#!/bin/bash
# Complete script to connect Amplify app to GitHub repository
# This will delete existing branches and reconnect with GitHub

set -e

APP_ID="d1054i3y445g1d"
REGION="eu-north-1"
REPO_OWNER="efebyrr-wq"
REPO_NAME="erp-ep"
BRANCH_NAME="staging"
GITHUB_TOKEN="${GITHUB_TOKEN:-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}"

echo "🔗 Connecting Amplify app to GitHub repository..."
echo "   App ID: $APP_ID"
echo "   Repository: $REPO_OWNER/$REPO_NAME"
echo "   Branch: $BRANCH_NAME"
echo ""

# Step 1: List existing branches
echo "📋 Checking existing branches..."
BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --region "$REGION" --query 'branches[].branchName' --output text)
echo "   Found branches: $BRANCHES"
echo ""

# Step 2: Delete existing branches (required to connect repository)
echo "🗑️  Deleting existing branches to enable repository connection..."
for BRANCH in $BRANCHES; do
    echo "   Deleting branch: $BRANCH"
    aws amplify delete-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --region "$REGION" \
        --output json || echo "   ⚠️  Could not delete $BRANCH (may already be deleted)"
done

# Wait a bit for deletion to complete
echo "   ⏳ Waiting for branch deletion to complete..."
sleep 5
echo ""

# Step 3: Connect app to GitHub repository
echo "🔗 Connecting app to GitHub repository..."
aws amplify update-app \
    --app-id "$APP_ID" \
    --region "$REGION" \
    --repository "https://github.com/$REPO_OWNER/$REPO_NAME.git" \
    --oauth-token "$GITHUB_TOKEN" \
    --output json

echo ""
echo "✅ App connected to GitHub repository!"
echo ""

# Step 4: Create new branch connected to GitHub
echo "🌿 Creating branch '$BRANCH_NAME' connected to GitHub..."
aws amplify create-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --region "$REGION" \
    --enable-auto-build \
    --stage PRODUCTION \
    --description "Connected to GitHub: $REPO_OWNER/$REPO_NAME" \
    --output json

echo ""
echo "✅ Branch created and connected to GitHub!"
echo ""

# Step 5: Set environment variables
echo "🔧 Setting environment variables..."
aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --region "$REGION" \
    --environment-variables "VITE_API_BASE_URL=https://d31tialuhzl449.cloudfront.net" \
    --output json

echo ""
echo "✅ Environment variables set!"
echo ""

# Step 6: Trigger initial build
echo "🚀 Triggering initial build from GitHub..."
aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-type RELEASE \
    --region "$REGION" \
    --output json

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Your Amplify app is now connected to GitHub:"
echo "   - Repository: https://github.com/$REPO_OWNER/$REPO_NAME"
echo "   - Branch: $BRANCH_NAME"
echo "   - Auto-deploy: Enabled"
echo ""
echo "   Every push to the '$BRANCH_NAME' branch will automatically trigger a deployment!"
echo ""
echo "   Monitor builds at: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"

