#!/bin/bash

# RDS Database Initialization Script for AWS CloudShell
# Run this in AWS CloudShell (eu-north-1 region)

set -e

ENDPOINT="erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com"
USERNAME="postgres"
PASSWORD="gevnon-6Gihna-hentom"
DATABASE="erp_2025"
SCHEMA_FILE="db/schema.sql"

echo "🚀 RDS Database Initialization in CloudShell"
echo "=============================================="
echo ""

# Check if PostgreSQL client is installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo yum install -y postgresql15
    echo "✅ PostgreSQL client installed"
    echo ""
fi

# Test connection
echo "📡 Testing connection to RDS..."
export PGPASSWORD="$PASSWORD"
if psql -h "$ENDPOINT" -U "$USERNAME" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
    echo ""
else
    echo "❌ Connection failed. Please check:"
    echo "   - Security group allows CloudShell IP"
    echo "   - Database is in 'Available' status"
    echo "   - Credentials are correct"
    exit 1
fi

# Check if database exists
echo "🔍 Checking if database '$DATABASE' exists..."
DB_EXISTS=$(psql -h "$ENDPOINT" -U "$USERNAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DATABASE'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database '$DATABASE' already exists."
    read -p "Do you want to drop and recreate it? (yes/no): " RECREATE
    if [ "$RECREATE" = "yes" ]; then
        echo "🗑️  Dropping existing database..."
        psql -h "$ENDPOINT" -U "$USERNAME" -d postgres -c "DROP DATABASE $DATABASE;"
        echo "✅ Database dropped."
    else
        echo "⏭️  Skipping database creation."
        exit 0
    fi
fi

# Create database
echo "📦 Creating database '$DATABASE'..."
psql -h "$ENDPOINT" -U "$USERNAME" -d postgres -c "CREATE DATABASE $DATABASE;"
echo "✅ Database '$DATABASE' created successfully!"
echo ""

# Check if schema file exists
if [ -f "$SCHEMA_FILE" ]; then
    echo "📄 Found schema file: $SCHEMA_FILE"
    read -p "Do you want to run the schema? (yes/no): " RUN_SCHEMA
    if [ "$RUN_SCHEMA" = "yes" ]; then
        echo "🚀 Running schema..."
        psql -h "$ENDPOINT" -U "$USERNAME" -d "$DATABASE" -f "$SCHEMA_FILE"
        echo "✅ Schema executed successfully!"
        echo ""
    fi
else
    echo "⚠️  Schema file not found: $SCHEMA_FILE"
    echo "   You can run it manually later."
    echo ""
fi

# Verify tables
echo "🔍 Verifying tables..."
TABLE_COUNT=$(psql -h "$ENDPOINT" -U "$USERNAME" -d "$DATABASE" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Found $TABLE_COUNT tables:"
    psql -h "$ENDPOINT" -U "$USERNAME" -d "$DATABASE" -c "\dt" | head -20
else
    echo "⚠️  No tables found. Schema may not have been executed."
fi

echo ""
echo "🎉 Database initialization completed!"
echo ""
echo "📝 Connection details:"
echo "   DB_HOST=$ENDPOINT"
echo "   DB_PORT=5432"
echo "   DB_USERNAME=$USERNAME"
echo "   DB_NAME=$DATABASE"
echo "   DB_SCHEMA=public"
echo ""

unset PGPASSWORD








