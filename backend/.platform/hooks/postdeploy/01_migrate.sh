#!/bin/bash
# Database migration script (if needed)
# This runs after deployment

echo "🔄 Running post-deployment database migrations..."

# Get the API URL from environment or use default
API_URL="${API_BASE_URL:-http://localhost:3000}"

# Wait a bit for the application to be fully ready
sleep 10

# Migration 1: Date to timestamp conversion
echo "1️⃣ Migrating date columns to timestamp with time zone..."
response1=$(curl -s -X POST "${API_URL}/database/migrate-date-to-timestamp" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

http_status1=$(echo "$response1" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body1=$(echo "$response1" | grep -v "HTTP_STATUS:")

if [ "$http_status1" = "200" ] || [ "$http_status1" = "201" ]; then
  echo "✅ Migration 1 successful!"
else
  echo "⚠️  Migration 1 skipped or failed (HTTP $http_status1)"
fi

# Migration 2: Remove outsource invoice columns
echo "2️⃣ Removing columns from outsource_invoice_lines..."
response2=$(curl -s -X POST "${API_URL}/database/migrate-remove-outsource-invoice-columns" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

http_status2=$(echo "$response2" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body2=$(echo "$response2" | grep -v "HTTP_STATUS:")

if [ "$http_status2" = "200" ] || [ "$http_status2" = "201" ]; then
  echo "✅ Migration 2 successful!"
else
  echo "⚠️  Migration 2 skipped or failed (HTTP $http_status2)"
fi

# Migration 3: Add binary storage columns to operations_details
echo "3️⃣ Adding binary storage columns to operations_details..."
response3=$(curl -s -X POST "${API_URL}/database/migrate-add-binary-storage-to-operations-details" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

http_status3=$(echo "$response3" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body3=$(echo "$response3" | grep -v "HTTP_STATUS:")

if [ "$http_status3" = "200" ] || [ "$http_status3" = "201" ]; then
  echo "✅ Migration 3 successful!"
else
  echo "⚠️  Migration 3 skipped or failed (HTTP $http_status3)"
fi

echo "✅ Post-deployment migrations completed!"








