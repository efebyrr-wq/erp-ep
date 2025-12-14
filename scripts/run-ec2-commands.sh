#!/bin/bash

# Exact commands to run with your EC2 IP: 51.21.181.69
# Copy and paste these commands in order

echo "=========================================="
echo "STEP 1: Run these on YOUR LOCAL MACHINE"
echo "=========================================="
echo ""
echo "# Navigate to project directory"
echo "cd /Users/efebayar/Documents/erp_2025"
echo ""
echo "# Set permissions on PEM file"
echo "chmod 400 erp-2025-pemfile.pem"
echo ""
echo "# Connect to EC2"
echo "ssh -i erp-2025-pemfile.pem ec2-user@51.21.181.69"
echo ""
echo "=========================================="
echo "STEP 2: After connecting to EC2, run these ON EC2"
echo "=========================================="
echo ""
echo "# Install PostgreSQL client"
echo "sudo yum update -y"
echo "sudo yum install -y postgresql15"
echo ""
echo "# Set RDS password"
echo "export PGPASSWORD='gevnon-6Gihna-hentom'"
echo ""
echo "# Test connection"
echo "psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c \"SELECT version();\""
echo ""
echo "# Create database"
echo "psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c \"CREATE DATABASE erp_2025;\""
echo ""
echo "=========================================="
echo "STEP 3: Open NEW terminal on LOCAL MACHINE"
echo "=========================================="
echo ""
echo "# Upload schema file"
echo "cd /Users/efebayar/Documents/erp_2025"
echo "scp -i erp-2025-pemfile.pem db/schema.sql ec2-user@51.21.181.69:~/"
echo ""
echo "=========================================="
echo "STEP 4: Back on EC2 terminal"
echo "=========================================="
echo ""
echo "# Run schema"
echo "psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -f schema.sql"
echo ""
echo "# Verify tables"
echo "psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp_2025 -c \"\\dt\""
echo ""






