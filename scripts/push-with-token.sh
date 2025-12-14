#!/bin/bash
# Script to push with Personal Access Token

echo "📤 Pushing to GitHub..."
echo ""
echo "GitHub requires a Personal Access Token (not password)"
echo ""
echo "If you have a token, it will be prompted below."
echo "If not, create one at: https://github.com/settings/tokens"
echo "   - Select scope: 'repo'"
echo "   - Token starts with 'ghp_'"
echo ""

cd /Users/efebayar/Documents/erp_2025

# Try to push - will prompt for credentials
git push -u origin main

echo ""
echo "✅ If successful, check: https://github.com/efebyrr-wq/erp"


