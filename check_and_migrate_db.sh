#!/bin/bash

# Script to check and migrate operations_details table

echo "Checking operations_details table structure..."

# Check if columns exist
psql postgresql://postgres:postgres@localhost:5432/erp_2025 -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'operations_details' 
AND column_name IN ('pricing_proposal_pdf', 'invoice_pdf', 'image_delivery_bundle', 'image_pickup_bundle')
ORDER BY column_name;
" 2>&1

echo ""
echo "Running migration if needed..."
psql postgresql://postgres:postgres@localhost:5432/erp_2025 -f db/migrations/add_binary_storage_to_operations_details.sql 2>&1

echo ""
echo "Verifying columns after migration..."
psql postgresql://postgres:postgres@localhost:5432/erp_2025 -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'operations_details' 
AND column_name IN ('pricing_proposal_pdf', 'invoice_pdf', 'image_delivery_bundle', 'image_pickup_bundle')
ORDER BY column_name;
" 2>&1









