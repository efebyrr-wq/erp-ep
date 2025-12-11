# How to Create the outsource_invoice_lines Table

The `outsource_invoice_lines` table needs to be created in your PostgreSQL database.

## Quick Solution

**Option 1: Using psql (Command Line)**

```bash
psql -h localhost -U postgres -d erp_2025 -f db/create-table-simple.sql
```

**Option 2: Copy and Paste SQL**

1. Open your PostgreSQL client (pgAdmin, DBeaver, or any SQL client)
2. Connect to your `erp_2025` database
3. Copy and paste the following SQL:

```sql
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

create index if not exists idx_outsource_invoice_lines_bill_id on public.outsource_invoice_lines(bill_id);
create index if not exists idx_outsource_invoice_lines_operation_id on public.outsource_invoice_lines(outsource_operation_id);
```

4. Execute the SQL

**Option 3: Using Node.js (if you have database access)**

```bash
cd backend
npx ts-node scripts/create-outsource-invoice-lines-table.ts
```

## Verify Table Creation

After running the SQL, verify the table exists:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'outsource_invoice_lines';
```

If the query returns a row, the table was created successfully.











