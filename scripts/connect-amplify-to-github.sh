#!/bin/bash
# Script to connect Amplify app to GitHub repository

set -e

APP_ID="d1054i3y445g1d"
REGION="eu-north-1"
REPO_OWNER="efebyrr-wq"
REPO_NAME="erp-ep"
BRANCH_NAME="staging"

echo "🔗 Connecting Amplify app to GitHub repository..."
echo "   App ID: $APP_ID"
echo "   Repository: $REPO_OWNER/$REPO_NAME"
echo "   Branch: $BRANCH_NAME"
echo ""

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN environment variable not set."
    echo "   For CLI connection, you'll need to use the AWS Console to authorize GitHub first."
    echo ""
    echo "   Alternative: Use AWS Console to connect:"
    echo "   1. Go to: https://console.aws.amazon.com/amplify"
    echo "   2. Select app: $APP_ID"
    echo "   3. Go to 'App settings' → 'General'"
    echo "   4. Click 'Edit' under 'Repository'"
    echo "   5. Select 'GitHub' and authorize"
    echo "   6. Select repository: $REPO_OWNER/$REPO_NAME"
    echo "   7. Select branch: $BRANCH_NAME"
    echo ""
    exit 1
fi

echo "📋 Updating Amplify app with repository information..."

# Update the app to connect to GitHub
# Note: This requires the app to be created with repository connection
# If the app was created without a repo, we need to use the console first

# Try to update the branch with repository information
echo "🔄 Updating branch configuration..."

aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --region "$REGION" \
    --enable-auto-build \
    --description "Connected to GitHub: $REPO_OWNER/$REPO_NAME" \
    --output json

echo ""
echo "✅ Branch updated!"
echo ""
echo "📝 Note: To fully connect to GitHub repository, you may need to:"
echo "   1. Go to AWS Amplify Console"
echo "   2. Select your app"
echo "   3. Go to 'App settings' → 'General'"
echo "   4. Click 'Edit' under 'Repository'"
echo "   5. Authorize GitHub and select the repository"
echo ""
echo "   Once connected, Amplify will automatically deploy on every push!"



