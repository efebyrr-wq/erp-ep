# CloudFront HTTPS Setup for Backend

## Current Issue
Frontend (HTTPS) cannot call Backend (HTTP) due to browser mixed content policy.

## Solution: CloudFront Distribution

Once your AWS account is verified for CloudFront, use this configuration:

### 1. Create CloudFront Distribution

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 2. Update Frontend API URL

After CloudFront is created, update `frontend/src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 
  import.meta.env.MODE === 'production' 
    ? 'https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net'  // Replace with actual CloudFront URL
    : 'http://localhost:3000';
```

### 3. Update Backend CORS

Update `backend/src/main.ts` to allow CloudFront origin:

```typescript
cors: {
  origin: [
    process.env.FRONTEND_URL || 'https://staging.d1054i3y445g1d.amplifyapp.com',
    'https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net'
  ],
  credentials: true,
}
```

## Steps to Verify AWS Account

1. Go to AWS Support: https://console.aws.amazon.com/support/home
2. Create a support case
3. Request account verification for CloudFront
4. Once verified, run the CloudFront setup commands

## Alternative: Custom Domain with SSL

If you have a domain name:
1. Get SSL certificate from AWS Certificate Manager (ACM)
2. Configure Elastic Beanstalk with custom domain
3. Use HTTPS endpoint





