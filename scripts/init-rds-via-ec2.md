# Initialize RDS via EC2 Instance (Recommended Alternative)

Since CloudShell isn't available, use an EC2 instance as a jump host.

## Step 1: Launch EC2 Instance

1. **Go to EC2 Console:**
   - AWS Console → EC2 → Instances → Launch Instance

2. **Configure Instance:**
   - **Name:** `rds-jump-host` (or any name)
   - **AMI:** Amazon Linux 2023 (free tier eligible)
   - **Instance type:** t3.micro (free tier eligible)
   - **Key pair:** Create new key pair or select existing
     - Name: `erp-key` (or any name)
     - **Download the .pem file** - you'll need it!
   - **Network settings:**
     - **VPC:** `vpc-0a4a208481959bfdd` (same as your RDS)
     - **Subnet:** Any subnet in the same VPC
     - **Auto-assign Public IP:** Enable
     - **Security group:** Create new security group
       - Name: `ec2-jump-host-sg`
       - **Inbound rule:** SSH (port 22) from `My IP` or `0.0.0.0/0` (temporary)
   - **Storage:** 8 GB (default, free tier)

3. **Launch Instance:**
   - Click "Launch instance"
   - Wait 1-2 minutes for it to be "Running"

## Step 2: Connect to EC2

### On macOS/Linux:
```bash
# Make key file executable
chmod 400 erp-key.pem

# Connect (replace with your EC2 public IP)
ssh -i erp-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### On Windows:
Use PuTTY or WSL with the same command.

## Step 3: Install PostgreSQL Client on EC2

Once connected to EC2, run:
```bash
sudo yum update -y
sudo yum install -y postgresql15
```

## Step 4: Connect to RDS from EC2

```bash
# Set password
export PGPASSWORD='gevnon-6Gihna-hentom'

# Test connection
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c "SELECT version();"
```

If this works, proceed to initialize the database.

## Step 5: Initialize Database

### Option A: Upload schema.sql to EC2

**From your local machine:**
```bash
# Upload schema file to EC2
scp -i erp-key.pem db/schema.sql ec2-user@<EC2_PUBLIC_IP>:~/
```

**Back on EC2:**
```bash
# Create database
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c "CREATE DATABASE erp_2025;"

# Run schema
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -f schema.sql

# Verify tables
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -c "\dt"
```

### Option B: Clone from Git (if your repo is on GitHub)

**On EC2:**
```bash
# Install git
sudo yum install -y git

# Clone your repo
git clone <your-repo-url>
cd erp_2025

# Create database and run schema
export PGPASSWORD='gevnon-6Gihna-hentom'
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c "CREATE DATABASE erp_2025;"
psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -f db/schema.sql
```

## Step 6: Clean Up (Optional)

After initialization, you can:
- Stop the EC2 instance (to save costs)
- Or keep it running for future database tasks

## Cost

- **t3.micro EC2:** Free tier eligible (750 hours/month)
- **If not free tier:** ~$7-10/month if running 24/7
- **Recommendation:** Stop instance when not in use








