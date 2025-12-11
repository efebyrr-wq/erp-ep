# How to Set Environment Variables in Elastic Beanstalk

## Where to Find It

The environment variables are set in the **Software** configuration section. If you don't see "Software" in your list, it might be:

1. **At the top of the configuration list** (scroll up)
2. **Or you can set them via AWS CLI** (I'll show you both methods)

## Method 1: Via AWS Console (Recommended)

### Step 1: Find Software Section
1. In the **Configuration** page, look for **"Software"** option
2. If you don't see it, try scrolling up - it's usually the first option
3. Click on **"Software"**

### Step 2: Edit Environment Properties
1. Click **"Edit"** button
2. Scroll down to **"Environment properties"** section
3. You'll see existing variables: `NODE_ENV` and `PORT`

### Step 3: Add Database Variables
Click **"Add environment property"** for each:

```
DB_HOST = erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com
DB_PORT = 5432
DB_USERNAME = postgres
DB_PASSWORD = gevnon-6Gihna-hentom
DB_NAME = erp_2025
DB_SCHEMA = public
```

### Step 4: Apply
1. Click **"Apply"** at the bottom
2. Wait 5-10 minutes for update

## Method 2: Via AWS CLI (If Console Doesn't Work)

If you can't find the Software section, I can set them via command line. Just let me know!

## What Each Section Does

- **Software** ← **YOU NEED THIS ONE** (for environment variables)
- Service access - IAM roles
- Networking - VPC, subnets
- Database instance - RDS (we're using external RDS, so skip this)
- Traffic and scaling - Auto scaling
- Updating - Deployment settings
- Monitoring - CloudWatch
- Logs - Log retention

## Quick Check

After setting variables, the app should:
- ✅ Connect to RDS database
- ✅ Start successfully
- ✅ Show "🚀 Backend listening on http://localhost:8080" in logs

Let me know if you can't find the "Software" section and I'll set them via CLI!





