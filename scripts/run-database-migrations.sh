#!/bin/bash

# Script to run database migrations after backend deployment
# Usage: ./scripts/run-database-migrations.sh

set -e

CLOUDFRONT_URL="https://d31tialuhzl449.cloudfront.net"

echo "🔄 Running database migrations..."
echo ""

# Migration 1: Date to timestamp conversion
echo "1️⃣ Migrating date columns to timestamp with time zone..."
response1=$(curl -s -X POST "${CLOUDFRONT_URL}/database/migrate-date-to-timestamp" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status1=$(echo "$response1" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body1=$(echo "$response1" | grep -v "HTTP_STATUS:")

if [ "$http_status1" = "200" ]; then
  echo "✅ Migration 1 successful!"
  echo "$response_body1" | jq '.' 2>/dev/null || echo "$response_body1"
else
  echo "❌ Migration 1 failed (HTTP $http_status1)"
  echo "$response_body1"
  exit 1
fi

echo ""
echo "2️⃣ Removing columns from outsource_invoice_lines..."
response2=$(curl -s -X POST "${CLOUDFRONT_URL}/database/migrate-remove-outsource-invoice-columns" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status2=$(echo "$response2" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body2=$(echo "$response2" | grep -v "HTTP_STATUS:")

if [ "$http_status2" = "200" ]; then
  echo "✅ Migration 2 successful!"
  echo "$response_body2" | jq '.' 2>/dev/null || echo "$response_body2"
else
  echo "❌ Migration 2 failed (HTTP $http_status2)"
  echo "$response_body2"
  exit 1
fi

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "📋 Database changes applied:"
echo "  - Date columns converted to timestamp with time zone"
echo "  - Removed columns from outsource_invoice_lines table"

