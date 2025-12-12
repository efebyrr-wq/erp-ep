# Automatic Deployment Setup Guide

This guide explains how to set up automatic deployments from GitHub to AWS services.

## Overview

- **Frontend**: Automatically deploys to AWS Amplify when changes are pushed to `main` or `staging` branches
- **Backend**: Automatically deploys to Elastic Beanstalk when backend changes are pushed to `main` or `staging` branches

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository: `https://github.com/efebyrr-wq/erp-ep.git`
3. AWS CLI configured (or GitHub Secrets for CI/CD)

## Part 1: Frontend Auto-Deployment (Amplify)

Amplify can automatically detect and deploy from GitHub. Follow these steps:

### Option A: Connect Amplify to GitHub (Recommended)

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify
   - Click "New app" → "Host web app"

2. **Connect GitHub Repository**
   - Select "GitHub" as the source
   - Authorize AWS Amplify to access your GitHub account
   - Select repository: `efebyrr-wq/erp-ep`
   - Select branch: `staging` (or `main`)

3. **Configure Build Settings**
   - Amplify will auto-detect `amplify.yml` in the root
   - Verify the build settings match:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm ci
         build:
           commands:
             - cd frontend
             - npm run build
       artifacts:
         baseDirectory: frontend/dist
         files:
           - '**/*'
     ```

4. **Set Environment Variables**
   - In Amplify Console → App settings → Environment variables
   - Add: `VITE_API_BASE_URL=https://d31tialuhzl449.cloudfront.net`

5. **Save and Deploy**
   - Amplify will automatically deploy on every push to the connected branch

### Option B: Manual Trigger via GitHub Actions

If you prefer GitHub Actions, the workflow `.github/workflows/deploy-frontend.yml` will trigger on frontend changes. However, Amplify's built-in integration is more reliable.

## Part 2: Backend Auto-Deployment (Elastic Beanstalk)

Backend deployments use GitHub Actions to automatically deploy to Elastic Beanstalk.

### Step 1: Configure GitHub Secrets

1. **Go to GitHub Repository Settings**
   - Navigate to: https://github.com/efebyrr-wq/erp-ep/settings/secrets/actions
   - Click "New repository secret"

2. **Add Required Secrets**
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

   **To create AWS credentials:**
   - Go to: https://console.aws.amazon.com/iam
   - Users → Your user → Security credentials
   - Create access key
   - **Important**: Grant these permissions:
     - `ElasticBeanstalkFullAccess`
     - `S3FullAccess` (or specific bucket access)
     - `IAMReadOnlyAccess` (optional, for status checks)

### Step 2: Verify Workflow Configuration

The workflow `.github/workflows/deploy-backend.yml` is already configured with:
- **Application**: `deployment-erp`
- **Environment**: `Deployment-erp-env-v4`
- **Region**: `eu-north-1`
- **S3 Bucket**: `elasticbeanstalk-eu-north-1-717036606024`

### Step 3: Test the Deployment

1. **Make a backend change**
   ```bash
   # Make any change to backend code
   git add backend/
   git commit -m "Test: Trigger backend deployment"
   git push origin main
   ```

2. **Monitor Deployment**
   - Go to: https://github.com/efebyrr-wq/erp-ep/actions
   - Watch the "Deploy Backend to Elastic Beanstalk" workflow
   - Check AWS Elastic Beanstalk console for deployment status

## How It Works

### Frontend Deployment Flow

```
GitHub Push (frontend/** or amplify.yml)
    ↓
Amplify detects change (if connected)
    ↓
Amplify builds using amplify.yml
    ↓
Deploys to Amplify hosting
```

### Backend Deployment Flow

```
GitHub Push (backend/**)
    ↓
GitHub Actions workflow triggers
    ↓
Builds backend (npm ci, npm run build)
    ↓
Creates deployment ZIP
    ↓
Uploads to S3
    ↓
Creates EB application version
    ↓
Updates EB environment
    ↓
Deployment complete
```

## Branch Strategy

- **`main` branch**: Production deployments
- **`staging` branch**: Staging/test deployments

Both branches trigger automatic deployments. You can modify the workflows to restrict to specific branches.

## Manual Deployment

If you need to manually trigger deployments:

### Frontend
- Push to GitHub (Amplify will auto-deploy)
- Or use Amplify Console → "Redeploy this version"

### Backend
- Go to: https://github.com/efebyrr-wq/erp-ep/actions
- Select "Deploy Backend to Elastic Beanstalk"
- Click "Run workflow"

## Monitoring Deployments

### Frontend (Amplify)
- AWS Amplify Console: https://console.aws.amazon.com/amplify
- View build logs, deployment history, and status

### Backend (Elastic Beanstalk)
- AWS Elastic Beanstalk Console: https://console.aws.amazon.com/elasticbeanstalk
- GitHub Actions: https://github.com/efebyrr-wq/erp-ep/actions

## Troubleshooting

### Backend Deployment Fails

1. **Check GitHub Secrets**
   - Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
   - Ensure credentials have correct permissions

2. **Check AWS Permissions**
   - User must have `ElasticBeanstalkFullAccess`
   - User must have S3 access to `elasticbeanstalk-eu-north-1-717036606024`

3. **Check Workflow Logs**
   - Go to GitHub Actions → Failed workflow → View logs
   - Look for specific error messages

### Frontend Deployment Fails

1. **Check Amplify Build Logs**
   - Go to Amplify Console → Build history
   - Review build logs for errors

2. **Verify amplify.yml**
   - Ensure `amplify.yml` is in the repository root
   - Check YAML syntax is correct

3. **Check Environment Variables**
   - Verify `VITE_API_BASE_URL` is set in Amplify

## Updating Configuration

### Change Backend Deployment Settings

Edit `.github/workflows/deploy-backend.yml`:
```yaml
env:
  AWS_REGION: eu-north-1
  EB_APPLICATION_NAME: deployment-erp
  EB_ENVIRONMENT_NAME: Deployment-erp-env-v4
  S3_BUCKET: elasticbeanstalk-eu-north-1-717036606024
```

### Change Frontend Build Settings

Edit `amplify.yml` in the repository root.

## Security Best Practices

1. **Never commit AWS credentials**
   - Always use GitHub Secrets
   - Rotate credentials regularly

2. **Use IAM roles with least privilege**
   - Grant only necessary permissions
   - Use separate credentials for CI/CD

3. **Enable branch protection**
   - Require pull request reviews
   - Prevent force pushes to main

## Next Steps

1. ✅ Connect Amplify to GitHub repository
2. ✅ Add GitHub Secrets for AWS credentials
3. ✅ Test deployment with a small change
4. ✅ Monitor first automatic deployment
5. ✅ Set up branch protection rules (optional)

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check AWS CloudWatch logs (for backend)
3. Check Amplify build logs (for frontend)
4. Review this guide for common issues

