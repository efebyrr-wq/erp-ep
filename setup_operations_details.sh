#!/bin/bash

# Script to create operations_details table and add binary storage columns

echo "Creating operations_details table and adding binary storage columns..."

psql postgresql://postgres:postgres@localhost:5432/erp_2025 -f create_operations_details_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Successfully created operations_details table and added binary storage columns!"
    echo ""
    echo "Verifying table structure..."
    psql postgresql://postgres:postgres@localhost:5432/erp_2025 -c "\d operations_details"
else
    echo "❌ Failed to create table. Please check your database connection."
    exit 1
fi








