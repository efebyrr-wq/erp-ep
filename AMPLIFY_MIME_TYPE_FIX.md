# Fix MIME Type Issue in AWS Amplify

## Problem
JavaScript files are being served with `application/octet-stream` instead of `application/javascript`, causing browser errors.

## Solution: Set Custom Headers in Amplify Console

Since `amplify.yml` customHeaders might not work with pre-built deployments, set headers directly in the console:

### Step 1: Go to Amplify Console
1. Go to AWS Amplify → `erp-2025-frontend`
2. Click **"App settings"** (left sidebar)
3. Click **"Rewrites and redirects"**

### Step 2: Add Custom Headers
1. Click **"Manage rewrites and redirects"**
2. Add these rules:

**Rule 1: JavaScript files**
- Source address: `/assets/**/*.js`
- Target address: `/assets/$1.js`
- Type: **Rewrite**
- Status code: (leave empty)
- **Custom headers**: Add header
  - Header name: `Content-Type`
  - Header value: `application/javascript; charset=utf-8`

**Rule 2: All JS files**
- Source address: `/**/*.js`
- Target address: `/$1.js`
- Type: **Rewrite**
- **Custom headers**: Add header
  - Header name: `Content-Type`
  - Header value: `application/javascript; charset=utf-8`

**Rule 3: SPA Routing**
- Source address: `/*`
- Target address: `/index.html`
- Type: **Rewrite**
- Status code: `200`

### Step 3: Deploy
1. Deploy the latest version: `frontend-deploy-amplify-fix.zip`
2. Wait for deployment to complete
3. Test the application

## Alternative: Use AWS CLI

```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

# This might not work directly, but you can try:
aws amplify update-branch \
  --app-id d1054i3y445g1d \
  --branch-name staging \
  --custom-headers '{"pattern":"/**/*.js","headers":[{"key":"Content-Type","value":"application/javascript; charset=utf-8"}]}' \
  --region eu-north-1
```

## Check Current Headers

After setting, verify with:
```bash
curl -I https://staging.d1054i3y445g1d.amplifyapp.com/assets/index-*.js
```

You should see: `Content-Type: application/javascript; charset=utf-8`





