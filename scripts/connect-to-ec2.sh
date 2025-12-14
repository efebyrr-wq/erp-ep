#!/bin/bash

# Commands to connect to EC2 and initialize RDS
# Replace <EC2_PUBLIC_IP> with your actual EC2 instance public IP

# ============================================
# STEP 1: Run these commands on YOUR LOCAL MACHINE
# ============================================

echo "=== STEP 1: Local Machine Commands ==="
echo ""
echo "1. Navigate to where your PEM file is located:"
echo "   cd /Users/efebayar/Documents/erp_2025"
echo ""
echo "2. Set correct permissions on PEM file:"
echo "   chmod 400 erp-2025-pemfile.pem"
echo ""
echo "3. Connect to EC2 (replace <EC2_PUBLIC_IP> with your EC2 IP):"
echo "   ssh -i erp-2025-pemfile.pem ec2-user@<EC2_PUBLIC_IP>"
echo ""
echo "   Example:"
echo "   ssh -i erp-2025-pemfile.pem ec2-user@3.120.45.67"
echo ""
echo "============================================"
echo ""

# ============================================
# STEP 2: After connecting to EC2, run these commands ON THE EC2 INSTANCE
# ============================================

echo "=== STEP 2: EC2 Instance Commands (run after SSH connection) ==="
echo ""
echo "1. Update system and install PostgreSQL client:"
echo "   sudo yum update -y"
echo "   sudo yum install -y postgresql15"
echo ""
echo "2. Set RDS password as environment variable:"
echo "   export PGPASSWORD='gevnon-6Gihna-hentom'"
echo ""
echo "3. Test connection to RDS:"
echo "   psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c \"SELECT version();\""
echo ""
echo "4. Create the database:"
echo "   psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c \"CREATE DATABASE erp_2025;\""
echo ""
echo "5. Upload schema.sql to EC2 (from your LOCAL machine, in a NEW terminal):"
echo "   scp -i erp-2025-pemfile.pem db/schema.sql ec2-user@<EC2_PUBLIC_IP>:~/"
echo ""
echo "6. Run the schema (back on EC2):"
echo "   psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -f schema.sql"
echo ""
echo "7. Verify tables were created:"
echo "   psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -c \"\\dt\""
echo ""






