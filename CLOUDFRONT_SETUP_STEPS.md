# CloudFront Setup Steps - Console Guide

## Step 3: Specify Origin

### ✅ **Origin Type:**
Select: **"Other"** (last option in the list)
- Description: "Refer to any AWS or non-AWS origin through its publicly resolvable URL."
- **Why:** Your backend is on Elastic Beanstalk, not S3

### ✅ **Origin:**
Enter your Elastic Beanstalk URL:
```
Deployment-erp-env-v4.eba-xspmy4pt.eu-north-1.elasticbeanstalk.com
```

### ✅ **Origin Path:**
Leave this **empty** (or enter `/` if required)
- Your backend API is at the root, so no path needed

### ✅ **Settings:**
- **Origin settings:** Select "Use recommended origin settings" (default)
- This will automatically configure:
  - HTTP port: 80
  - HTTPS port: 443
  - Origin protocol policy: HTTP only (since your backend is HTTP)

---

## Step 4: Enable Security (Next Step)

### ✅ **Viewer Protocol Policy:**
Select: **"Redirect HTTP to HTTPS"** or **"HTTPS Only"**
- This ensures all requests to CloudFront use HTTPS
- CloudFront will handle HTTPS, then forward to your HTTP backend

### ✅ **Allowed HTTP Methods:**
Select: **"GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"** (all methods)
- Your backend API needs all HTTP methods for REST API

### ✅ **Cache Policy:**
Select: **"CachingDisabled"** or **"CachingOptimized"**
- For API endpoints, "CachingDisabled" is usually better
- This ensures all requests reach your backend

---

## Step 5: Review and Create

### ✅ **Review:**
- Check that origin is: `Deployment-erp-env-v4.eba-xspmy4pt.eu-north-1.elasticbeanstalk.com`
- Check that viewer protocol is HTTPS
- Check that all HTTP methods are allowed

### ✅ **Create Distribution:**
- Click "Create distribution"
- Wait 5-15 minutes for distribution to deploy
- You'll get a CloudFront domain like: `d1234567890.cloudfront.net`

---

## After Creation

1. **Copy the CloudFront domain** (e.g., `d1234567890.cloudfront.net`)
2. **Update frontend** to use: `https://d1234567890.cloudfront.net`
3. **Test login** - it should work!

---

## Quick Checklist

- [ ] Origin Type: **Other**
- [ ] Origin: `Deployment-erp-env-v4.eba-xspmy4pt.eu-north-1.elasticbeanstalk.com`
- [ ] Origin Path: Empty
- [ ] Viewer Protocol: **HTTPS Only** or **Redirect HTTP to HTTPS**
- [ ] HTTP Methods: **All methods** (GET, POST, PUT, DELETE, etc.)
- [ ] Cache Policy: **CachingDisabled** (for API)





