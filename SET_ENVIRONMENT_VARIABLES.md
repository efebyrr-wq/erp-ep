# Set Environment Variables in Elastic Beanstalk

## Problem
The app is starting but can't connect to the database. It's trying to connect to `127.0.0.1:5432` (localhost) instead of the RDS endpoint.

This means the environment variables are **not set** in Elastic Beanstalk.

## Solution: Set Environment Variables

### Step 1: Go to Elastic Beanstalk Console
1. Go to: https://console.aws.amazon.com/elasticbeanstalk
2. Select your environment: **Deployment-erp-env**
3. Click **Configuration** (left sidebar)

### Step 2: Edit Software Configuration
1. Scroll down to **Software** section
2. Click **Edit**
3. Scroll to **Environment properties**

### Step 3: Add These Environment Variables

Click **Add environment property** for each one:

```
DB_HOST = erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com
DB_PORT = 5432
DB_USERNAME = postgres
DB_PASSWORD = gevnon-6Gihna-hentom
DB_NAME = erp_2025
DB_SCHEMA = public
PORT = 8080
NODE_ENV = production
```

### Step 4: Apply Changes
1. Click **Apply** at the bottom
2. Wait 5-10 minutes for the environment to update
3. The app will restart automatically

## Verify It's Working

After applying, check the logs:
1. Go to **Logs** tab
2. Click **Request logs** → **Last 100 Lines**
3. Look for: `🚀 Backend listening on http://localhost:8080`
4. Should NOT see: `ECONNREFUSED 127.0.0.1:5432`

## Important Notes

- **DB_PASSWORD** contains special characters - make sure to copy it exactly
- **DB_HOST** is the RDS endpoint (not localhost)
- After setting variables, the app will automatically restart
- The environment update takes 5-10 minutes

## Current Status

✅ **Deployment successful!**
✅ **App is starting!**
✅ **All modules loading correctly!**
❌ **Database connection failing** - needs environment variables

Once you set the environment variables, the app should connect to RDS and start successfully!





