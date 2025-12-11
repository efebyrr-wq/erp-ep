#!/bin/bash
# Export local database and push to RDS

set -e

# Load local database credentials from backend/.env if it exists
if [ -f "backend/.env" ]; then
  export $(grep -v '^#' backend/.env | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-erp_2025}

# RDS endpoint (from CloudFront or Elastic Beanstalk)
RDS_ENDPOINT=${RDS_ENDPOINT:-https://d31tialuhzl449.cloudfront.net}

# Temporary file for export
EXPORT_FILE=$(mktemp /tmp/local-db-export-XXXXXX.sql)

echo "📤 Step 1: Exporting local database..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USERNAME}" \
  -d "${DB_NAME}" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  -f "${EXPORT_FILE}"

if [ $? -ne 0 ]; then
  echo "❌ Export failed"
  rm -f "${EXPORT_FILE}"
  exit 1
fi

echo "✅ Export completed: $(du -h ${EXPORT_FILE} | cut -f1)"

# Read the SQL file
SQL_DATA=$(cat "${EXPORT_FILE}")
rm -f "${EXPORT_FILE}"

echo "📤 Step 2: Clearing RDS database and importing local data..."

# Send to RDS endpoint
RESPONSE=$(curl -s -X POST "${RDS_ENDPOINT}/database/clear-and-import" \
  -H "Content-Type: application/json" \
  -d "{\"sqlData\": $(echo "$SQL_DATA" | jq -Rs .)}")

if [ $? -ne 0 ]; then
  echo "❌ Failed to send data to RDS"
  exit 1
fi

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Process completed!"

