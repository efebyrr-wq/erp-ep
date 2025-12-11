#!/bin/bash
# Export local PostgreSQL database to SQL file

# Load local database credentials
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-erp_2025}

# Output file
OUTPUT_FILE="${1:-local-db-export.sql}"

echo "Exporting local database ${DB_NAME} to ${OUTPUT_FILE}..."

# Export data only (no schema)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USERNAME}" \
  -d "${DB_NAME}" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  -f "${OUTPUT_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ Export completed: ${OUTPUT_FILE}"
  echo "File size: $(du -h ${OUTPUT_FILE} | cut -f1)"
else
  echo "❌ Export failed"
  exit 1
fi

