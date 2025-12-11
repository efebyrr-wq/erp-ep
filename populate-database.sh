#!/bin/bash
# Script to populate ERP 2025 database with schema and seed data
# Run this in AWS CloudShell

DB_HOST="erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="erp-2025-db"
DB_PASSWORD="gevnon-6Gihna-hentom"

export PGPASSWORD="$DB_PASSWORD"

echo "📋 Step 1: Creating tax_payments table..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
CREATE TABLE IF NOT EXISTS public.tax_payments (
  tax_payment_id BIGSERIAL PRIMARY KEY,
  tax_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  account_id BIGINT NOT NULL,
  account_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_tax_payment_account
    FOREIGN KEY (account_id)
    REFERENCES public.accounts (account_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);
EOF

if [ $? -eq 0 ]; then
  echo "✅ tax_payments table created successfully"
else
  echo "⚠️  tax_payments table may already exist or accounts table missing"
fi

echo ""
echo "📋 Step 2: Loading seed data..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f - <<'SEED_EOF'
-- Seed data for ERP 2025 schema
set search_path to public;

-- Customers
INSERT INTO customers (name, balance, created_at) VALUES
  ('Acme Construction', 12500.00, now() - interval '45 days'),
  ('MetroBuild Corp', 8700.00, now() - interval '43 days'),
  ('Skyline Structures', 4350.00, now() - interval '41 days'),
  ('Evergreen Manufacturing', 9820.00, now() - interval '39 days'),
  ('Harbor Logistics', 3120.00, now() - interval '37 days')
ON CONFLICT DO NOTHING;

-- Accounts (needed for tax_payments foreign key)
INSERT INTO accounts (type, account_name, balance, created_at) VALUES
  ('Asset', 'Main Operating Account', 52300.00, now() - interval '65 days'),
  ('Asset', 'Receivables', 18750.00, now() - interval '63 days'),
  ('Liability', 'Accounts Payable', -14200.00, now() - interval '61 days')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, balance, created_at) VALUES
  ('Global Steel Ltd', 8200.00, now() - interval '45 days'),
  ('IronWorks Outsourcing', 4750.00, now() - interval '43 days'),
  ('Precision Tools Co', 3125.00, now() - interval '41 days')
ON CONFLICT DO NOTHING;

-- Machinery
INSERT INTO machinery (machine_number, machine_code, status, created_at) VALUES
  ('MCH-2001', 'DRL-700', 'Active', now() - interval '50 days'),
  ('MCH-2002', 'CUT-520', 'Active', now() - interval '48 days'),
  ('MCH-2003', 'LFT-310', 'Maintenance', now() - interval '46 days')
ON CONFLICT DO NOTHING;
SEED_EOF

if [ $? -eq 0 ]; then
  echo "✅ Seed data loaded successfully"
else
  echo "⚠️  Some seed data may already exist"
fi

echo ""
echo "✅ Database population complete!"
echo "🔍 Verify by checking: https://d31tialuhzl449.cloudfront.net/customers"


