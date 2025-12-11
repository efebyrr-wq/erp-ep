# Development Workflow Guide

This guide explains how to make changes to the ERP 2025 application components.

## Table of Contents
1. [Frontend Changes](#frontend-changes)
2. [Backend/API Changes](#backendapi-changes)
3. [Database Structure Changes](#database-structure-changes)
4. [Deployment Process](#deployment-process)

---

## Frontend Changes

### Local Development

1. **Navigate to frontend directory:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/frontend
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   - Frontend runs at `http://localhost:5173`
   - Hot reload is enabled - changes appear automatically

4. **Make your changes:**
   - Edit files in `frontend/src/`
   - Components: `frontend/src/components/`
   - Pages: `frontend/src/pages/`
   - API client: `frontend/src/lib/api.ts`
   - Styles: `frontend/src/*.css`

5. **Test locally:**
   - Ensure backend is running at `http://localhost:3000`
   - Or update `frontend/.env` to point to CloudFront:
     ```
     VITE_API_BASE_URL=https://d31tialuhzl449.cloudfront.net
     ```

### Build for Production

1. **Build the frontend:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/frontend
   npm run build
   ```
   - Output: `frontend/dist/`

2. **Test production build locally:**
   ```bash
   # Option 1: Use a simple HTTP server
   cd frontend/dist
   python3 -m http.server 8000
   # Visit http://localhost:8000
   
   # Option 2: Use npx serve
   npx serve -s frontend/dist -l 8000
   ```

### Deploy Frontend to Amplify

**Method 1: Automatic Deployment (Recommended)**
- Push changes to your Git repository
- Amplify automatically detects changes and deploys
- Ensure `amplify.yml` is configured correctly

**Method 2: Manual Deployment**
1. Build the frontend:
   ```bash
   cd /Users/efebayar/Documents/erp_2025/frontend
   npm run build
   ```

2. Upload to Amplify Console:
   - Go to AWS Amplify Console
   - Select your app
   - Click "Deploy" → "Deploy without Git provider"
   - Upload the `frontend/dist/` folder

**Method 3: Using AWS CLI**
```bash
cd /Users/efebayar/Documents/erp_2025/frontend
npm run build
aws amplify start-job --app-id YOUR_APP_ID --branch-name staging --job-type RELEASE
```

---

## Backend/API Changes

### Local Development

1. **Navigate to backend directory:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/backend
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Create/update `backend/.env`:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=postgres
     DB_PASSWORD=postgres
     DB_NAME=erp_2025
     DB_SCHEMA=public
     PORT=3000
     CORS_ORIGINS=http://localhost:5173,https://staging.d1054i3y445g1d.amplifyapp.com,https://d31tialuhzl449.cloudfront.net
     ```

4. **Start development server:**
   ```bash
   npm run start:dev
   ```
   - Backend runs at `http://localhost:3000`
   - Hot reload is enabled - changes appear automatically
   - Watch mode: automatically restarts on file changes

5. **Make your changes:**
   - Controllers: `backend/src/*/controllers/*.controller.ts`
   - Services: `backend/src/*/services/*.service.ts`
   - DTOs: `backend/src/*/dto/*.dto.ts`
   - Entities: `backend/src/entities/*.entity.ts`
   - Routes: Defined in controllers using decorators

6. **Test API endpoints:**
   ```bash
   # Test with curl
   curl http://localhost:3000/customers
   
   # Or use Postman/Insomnia
   # Or test from frontend running on localhost:5173
   ```

### Build Backend

1. **Build TypeScript to JavaScript:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/backend
   npm run build
   ```
   - Output: `backend/dist/`

2. **Test production build locally:**
   ```bash
   npm run start:prod
   # Or
   node dist/src/main.js
   ```

### Deploy Backend to Elastic Beanstalk

**Step-by-step deployment:**

1. **Build and package:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/backend
   npm run build
   ```

2. **Create deployment package:**
   ```bash
   zip -r erp-backend-deploy.zip dist/ package.json package-lock.json \
     -x "*.map" "*.tsbuildinfo" "node_modules/*"
   ```

3. **Upload to S3:**
   ```bash
   aws s3 cp erp-backend-deploy.zip \
     s3://elasticbeanstalk-eu-north-1-717036606024/erp-backend-deploy-$(date +%Y%m%d-%H%M%S).zip \
     --region eu-north-1
   ```

4. **Create application version:**
   ```bash
   VERSION_LABEL="my-changes-$(date +%Y%m%d-%H%M%S)"
   S3_KEY="erp-backend-deploy-YYYYMMDD-HHMMSS.zip"  # Replace with actual key from step 3
   
   aws elasticbeanstalk create-application-version \
     --region eu-north-1 \
     --application-name "deployment-erp" \
     --version-label "$VERSION_LABEL" \
     --source-bundle S3Bucket="elasticbeanstalk-eu-north-1-717036606024",S3Key="$S3_KEY" \
     --description "Description of your changes"
   ```

5. **Deploy to environment:**
   ```bash
   aws elasticbeanstalk update-environment \
     --region eu-north-1 \
     --environment-name "Deployment-erp-env-v4" \
     --version-label "$VERSION_LABEL"
   ```

6. **Monitor deployment:**
   ```bash
   # Check status
   aws elasticbeanstalk describe-environments \
     --region eu-north-1 \
     --environment-names "Deployment-erp-env-v4" \
     --query 'Environments[0].[Status,Health,VersionLabel]' \
     --output table
   
   # View logs
   aws elasticbeanstalk request-environment-info \
     --region eu-north-1 \
     --environment-name "Deployment-erp-env-v4" \
     --info-type tail
   ```

**Quick deployment script:**
```bash
#!/bin/bash
cd /Users/efebayar/Documents/erp_2025/backend
npm run build
zip -r erp-backend-deploy.zip dist/ package.json package-lock.json -x "*.map" "*.tsbuildinfo" "node_modules/*"
S3_KEY="erp-backend-deploy-$(date +%Y%m%d-%H%M%S).zip"
aws s3 cp erp-backend-deploy.zip s3://elasticbeanstalk-eu-north-1-717036606024/$S3_KEY --region eu-north-1
VERSION_LABEL="deploy-$(date +%Y%m%d-%H%M%S)"
aws elasticbeanstalk create-application-version --region eu-north-1 --application-name "deployment-erp" --version-label "$VERSION_LABEL" --source-bundle S3Bucket="elasticbeanstalk-eu-north-1-717036606024",S3Key="$S3_KEY" --description "Deployment $(date)" --output text --query 'ApplicationVersion.VersionLabel'
aws elasticbeanstalk update-environment --region eu-north-1 --environment-name "Deployment-erp-env-v4" --version-label "$VERSION_LABEL" --output text --query 'EnvironmentId'
```

---

## Database Structure Changes

### Schema Changes

**Option 1: Direct SQL Migration (Recommended for Production)**

1. **Create migration SQL file:**
   ```bash
   # Create a new migration file
   touch /Users/efebayar/Documents/erp_2025/db/migrations/add_new_column.sql
   ```

2. **Write migration SQL:**
   ```sql
   -- Example: Add a new column
   ALTER TABLE public.customers 
   ADD COLUMN IF NOT EXISTS new_field TEXT;
   
   -- Example: Create a new table
   CREATE TABLE IF NOT EXISTS public.new_table (
     id BIGSERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Apply to local database:**
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/erp_2025 \
     -f /Users/efebayar/Documents/erp_2025/db/migrations/add_new_column.sql
   ```

4. **Apply to RDS database:**
   - **Method A: Via Database Setup Endpoint (if migration is small)**
     - Add migration SQL to `backend/src/database/database-setup.controller.ts`
     - Call `POST /database/setup` endpoint
   
   - **Method B: Via psql (requires RDS access)**
     ```bash
     # Get RDS endpoint from Elastic Beanstalk environment variables
     psql postgresql://postgres:PASSWORD@erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com:5432/erp_2025 \
       -f /Users/efebayar/Documents/erp_2025/db/migrations/add_new_column.sql
     ```
   
   - **Method C: Via AWS Systems Manager Session Manager (if EC2 access available)**
     ```bash
     # Connect to EC2 instance
     aws ssm start-session --target i-xxxxx --region eu-north-1
     # Then run psql from EC2
     ```

**Option 2: TypeORM Migrations (For Development)**

1. **Generate migration:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/backend
   npm run typeorm migration:generate -- -n AddNewColumn
   ```

2. **Run migration locally:**
   ```bash
   npm run typeorm migration:run
   ```

3. **Apply to RDS:**
   - Deploy backend with migration files
   - Run migrations on startup or via endpoint

### Update Entity Classes

When changing database schema, update corresponding TypeORM entities:

1. **Edit entity file:**
   ```typescript
   // backend/src/entities/customer.entity.ts
   @Entity({ name: 'customers' })
   export class Customer {
     // ... existing columns
     
     @Column({ type: 'text', nullable: true })
     newField!: string | null;  // Add new column
   }
   ```

2. **Rebuild backend:**
   ```bash
   cd /Users/efebayar/Documents/erp_2025/backend
   npm run build
   ```

3. **Deploy backend** (see Backend Deployment section)

### Data Migrations

**To migrate existing data:**

1. **Create data migration script:**
   ```bash
   touch /Users/efebayar/Documents/erp_2025/db/migrations/migrate_data.sql
   ```

2. **Write migration SQL:**
   ```sql
   -- Example: Update existing data
   UPDATE public.customers 
   SET new_field = 'default_value' 
   WHERE new_field IS NULL;
   ```

3. **Apply migration** (same methods as schema changes)

---

## Deployment Process

### Complete Deployment Workflow

**1. Frontend Deployment:**
```bash
# Build
cd /Users/efebayar/Documents/erp_2025/frontend
npm run build

# Deploy to Amplify (automatic if using Git, or manual upload)
# Or use AWS CLI
aws amplify start-job --app-id YOUR_APP_ID --branch-name staging --job-type RELEASE
```

**2. Backend Deployment:**
```bash
# Build
cd /Users/efebayar/Documents/erp_2025/backend
npm run build

# Package
zip -r erp-backend-deploy.zip dist/ package.json package-lock.json \
  -x "*.map" "*.tsbuildinfo" "node_modules/*"

# Upload and deploy
S3_KEY="erp-backend-deploy-$(date +%Y%m%d-%H%M%S).zip"
aws s3 cp erp-backend-deploy.zip \
  s3://elasticbeanstalk-eu-north-1-717036606024/$S3_KEY --region eu-north-1

VERSION_LABEL="deploy-$(date +%Y%m%d-%H%M%S)"
aws elasticbeanstalk create-application-version \
  --region eu-north-1 \
  --application-name "deployment-erp" \
  --version-label "$VERSION_LABEL" \
  --source-bundle S3Bucket="elasticbeanstalk-eu-north-1-717036606024",S3Key="$S3_KEY"

aws elasticbeanstalk update-environment \
  --region eu-north-1 \
  --environment-name "Deployment-erp-env-v4" \
  --version-label "$VERSION_LABEL"
```

**3. Database Changes:**
- Apply SQL migrations to RDS (see Database Structure Changes section)

### Environment Variables

**Backend Environment Variables (Elastic Beanstalk):**
```bash
# View current environment variables
aws elasticbeanstalk describe-configuration-settings \
  --region eu-north-1 \
  --application-name "deployment-erp" \
  --environment-name "Deployment-erp-env-v4" \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]'

# Update environment variable
aws elasticbeanstalk update-environment \
  --region eu-north-1 \
  --environment-name "Deployment-erp-env-v4" \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PASSWORD,Value=new_password
```

**Frontend Environment Variables (Amplify):**
- Set in Amplify Console → App Settings → Environment variables
- Or in `amplify.yml`:
  ```yaml
  env:
    VITE_API_BASE_URL: https://d31tialuhzl449.cloudfront.net
  ```

---

## Best Practices

### 1. Development Workflow
- ✅ Always test changes locally before deploying
- ✅ Use version control (Git) for all changes
- ✅ Write clear commit messages
- ✅ Test API endpoints with Postman/curl before frontend integration

### 2. Database Changes
- ✅ Always backup database before schema changes
- ✅ Test migrations on local database first
- ✅ Use transactions for data migrations
- ✅ Document all schema changes

### 3. Deployment
- ✅ Deploy during low-traffic periods
- ✅ Monitor deployment logs
- ✅ Have a rollback plan
- ✅ Test production endpoints after deployment

### 4. API Changes
- ✅ Maintain backward compatibility when possible
- ✅ Version APIs if breaking changes are needed
- ✅ Update API documentation
- ✅ Update frontend API client accordingly

### 5. Frontend Changes
- ✅ Test on multiple browsers
- ✅ Ensure responsive design works
- ✅ Test with real API data
- ✅ Check for console errors

---

## Quick Reference Commands

### Start Local Development
```bash
# Terminal 1: Backend
cd /Users/efebayar/Documents/erp_2025/backend
npm run start:dev

# Terminal 2: Frontend
cd /Users/efebayar/Documents/erp_2025/frontend
npm run dev
```

### Sync Local Data to RDS
```bash
cd /Users/efebayar/Documents/erp_2025/backend
node scripts/export-and-push-to-rds.js
```

### Check Deployment Status
```bash
aws elasticbeanstalk describe-environments \
  --region eu-north-1 \
  --environment-names "Deployment-erp-env-v4" \
  --query 'Environments[0].[Status,Health,VersionLabel]' \
  --output table
```

### View Backend Logs
```bash
aws elasticbeanstalk request-environment-info \
  --region eu-north-1 \
  --environment-name "Deployment-erp-env-v4" \
  --info-type tail
```

---

## Troubleshooting

### Backend Not Starting
- Check environment variables in Elastic Beanstalk
- Verify database connection settings
- Check logs: `aws elasticbeanstalk request-environment-info --info-type tail`

### Frontend Not Loading Data
- Verify `VITE_API_BASE_URL` in `frontend/.env` or `amplify.yml`
- Check browser console for CORS errors
- Verify backend is running and accessible

### Database Connection Issues
- Verify RDS security group allows connections
- Check database credentials in environment variables
- Test connection: `psql postgresql://user:pass@host:5432/dbname`

### Deployment Failures
- Check Elastic Beanstalk logs
- Verify all dependencies in `package.json`
- Ensure build completes without errors
- Check S3 bucket permissions

