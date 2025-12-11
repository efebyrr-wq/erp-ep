-- Add customer_name column to payment tables for balance tracking

ALTER TABLE public.payments_check
ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.payment_credit_card
ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.payments_cash
ADD COLUMN IF NOT EXISTS customer_name TEXT;





