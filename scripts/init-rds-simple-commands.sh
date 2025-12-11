#!/bin/bash

# Simple commands to run on EC2 instance to initialize RDS
# Copy and paste these commands one by one into your EC2 terminal

ENDPOINT="erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com"
USERNAME="postgres"
PASSWORD="gevnon-6Gihna-hentom"
DATABASE="erp_2025"

echo "=== RDS Database Initialization Commands ==="
echo ""
echo "1. Set password:"
echo "export PGPASSWORD='$PASSWORD'"
echo ""
echo "2. Test connection:"
echo "psql -h $ENDPOINT -U $USERNAME -d postgres -c \"SELECT version();\""
echo ""
echo "3. Create database:"
echo "psql -h $ENDPOINT -U $USERNAME -d postgres -c \"CREATE DATABASE $DATABASE;\""
echo ""
echo "4. Run schema (if schema.sql is in current directory):"
echo "psql -h $ENDPOINT -U $USERNAME -d $DATABASE -f schema.sql"
echo ""
echo "5. Verify tables:"
echo "psql -h $ENDPOINT -U $USERNAME -d $DATABASE -c \"\\dt\""
echo ""
echo "6. List all databases:"
echo "psql -h $ENDPOINT -U $USERNAME -d postgres -c \"\\l\""
echo ""





