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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);


