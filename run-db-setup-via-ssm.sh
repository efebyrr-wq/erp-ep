#!/bin/bash
# Run database setup via AWS Systems Manager on Elastic Beanstalk instance
# This script uses SSM to execute SQL on the EC2 instance

INSTANCE_ID="i-0b0dd4566de5448da"
REGION="eu-north-1"

echo "📋 Running database setup via SSM..."

# Create a temporary script file with the SQL
cat > /tmp/db-setup.sql << 'SQL_EOF'
-- Create tax_payments table
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
SQL_EOF

# Upload SQL file to S3 or use inline
# For now, we'll use a base64 encoded approach or direct command

echo "🚀 Executing via SSM..."

aws ssm send-command \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[
    'export PGPASSWORD=\"gevnon-6Gihna-hentom\"',
    'psql -h erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com -U postgres -d erp-2025-db << \"EOF\"',
    'CREATE TABLE IF NOT EXISTS public.tax_payments (',
    '  tax_payment_id BIGSERIAL PRIMARY KEY,',
    '  tax_type TEXT NOT NULL,',
    '  amount NUMERIC NOT NULL,',
    '  payment_date DATE NOT NULL,',
    '  account_id BIGINT NOT NULL,',
    '  account_name TEXT,',
    '  notes TEXT,',
    '  created_at TIMESTAMPTZ DEFAULT NOW(),',
    '  CONSTRAINT fk_tax_payment_account',
    '    FOREIGN KEY (account_id)',
    '    REFERENCES public.accounts (account_id)',
    '    ON DELETE RESTRICT',
    ');',
    'CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);',
    'CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);',
    'EOF',
    'echo \"✅ tax_payments table created\"'
  ]" \
  --output text \
  --query 'Command.CommandId'

echo ""
echo "⏳ Waiting for command to complete..."
echo "Check status with: aws ssm list-command-invocations --command-id <COMMAND_ID> --region $REGION"


