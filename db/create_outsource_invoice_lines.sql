-- Create outsource_invoice_lines table
-- Run this script in your PostgreSQL database to create the table

create table if not exists public.outsource_invoice_lines (
  id bigint primary key generated always as identity,
  bill_id bigint references public.invoices (id) on delete cascade,
  outsource_operation_id bigint references public.outsource_operations (id),
  outsourcer_name text,
  customer_name text,
  machine_code text,
  working_site_name text,
  type text,
  details text,
  unit_price numeric,
  amount numeric,
  total_price numeric,
  start_date date,
  end_date date,
  created_at timestamp with time zone default now()
);

-- Add index for better query performance
create index if not exists idx_outsource_invoice_lines_bill_id on public.outsource_invoice_lines(bill_id);
create index if not exists idx_outsource_invoice_lines_operation_id on public.outsource_invoice_lines(outsource_operation_id);











