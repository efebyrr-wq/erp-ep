-- Schema: ERP 2025 core data model
-- This script rebuilds the database objects described in the requested migration history.
-- It uses DROP ... CASCADE to ensure the script is idempotent when rerun in the same database.

set search_path to public;

-- ---------------------------------------------------------------------------
-- Tear down existing objects (in dependency order via CASCADE where needed)
-- ---------------------------------------------------------------------------

drop table if exists public.outsource_invoice_lines cascade;
drop table if exists public.invoice_lines_rental cascade;
drop table if exists public.invoice_lines cascade;
drop table if exists public.invoices cascade;
drop table if exists public.bill_lines_rental cascade;
drop table if exists public.bill_lines cascade;
drop table if exists public.bills cascade;
drop table if exists public.collection_cash cascade;
drop table if exists public.collection_credit_card cascade;
drop table if exists public.collections_check cascade;
drop table if exists public.payment_cash cascade;
drop table if exists public.payment_credit_card cascade;
drop table if exists public.payments_cash cascade;
drop table if exists public.payments_check cascade;
drop table if exists public.accounts cascade;
drop table if exists public.service_operations cascade;
drop table if exists public.internal_operations cascade;
drop table if exists public.outsource_operations cascade;
drop table if exists public.transportation_operations cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.machinery_specs cascade;
drop table if exists public.machinery cascade;
drop table if exists public.supplier_contact_persons cascade;
drop table if exists public.supplies cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.outsourcer_contact_persons cascade;
drop table if exists public.outsourcers cascade;
drop table if exists public.inventory cascade;
drop table if exists public.working_sites cascade;
drop table if exists public.contact_persons cascade;
drop table if exists public.customers cascade;

-- ---------------------------------------------------------------------------
-- Core customer domain
-- ---------------------------------------------------------------------------

create table public.customers (
  id bigint primary key generated always as identity,
  name text not null,
  balance numeric(10, 2) default 0.00,
  phone_number text,
  address text,
  email text,
  vergi_dairesi text,
  vkn text,
  created_at timestamp with time zone default now()
);

create table public.contact_persons (
  id bigint primary key generated always as identity,
  customer_id bigint not null references public.customers (id),
  name text not null,
  role text not null,
  email text not null,
  phone_number text not null,
  created_at timestamp with time zone default now()
);

create table public.working_sites (
  id bigint primary key generated always as identity,
  working_site_name text not null,
  location text not null,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------------------
-- Supplier domain
-- ---------------------------------------------------------------------------

create table public.suppliers (
  id bigint primary key generated always as identity,
  name text not null,
  balance numeric(10, 2) default 0.00,
  created_at timestamp with time zone default now()
);

create table public.supplies (
  id bigint primary key generated always as identity,
  supplier_id bigint not null references public.suppliers (id),
  type text not null,
  product_name text not null,
  quantity int not null,
  price numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

create table public.supplier_contact_persons (
  id bigint primary key generated always as identity,
  supplier_id bigint not null references public.suppliers (id),
  name text not null,
  role text not null,
  email text not null,
  phone_number text not null,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------------------
-- Machinery & inventory
-- ---------------------------------------------------------------------------

create table public.machinery (
  id bigint primary key generated always as identity,
  machine_number text not null,
  machine_code text not null,
  status text,
  created_at timestamp with time zone default now()
);

create table public.machinery_specs (
  id bigint primary key generated always as identity,
  machinery_id bigint not null references public.machinery (id),
  spec_name text not null,
  spec_value text not null,
  created_at timestamp with time zone default now()
);

create table public.inventory (
  id bigint primary key generated always as identity,
  item_name text not null,
  quantity int not null,
  reference_bill_id bigint,
  used_at date
);

-- ---------------------------------------------------------------------------
-- Outsourcer domain
-- ---------------------------------------------------------------------------

create table public.outsourcers (
  id bigint primary key generated always as identity,
  name text not null,
  balance numeric(10, 2) default 0.00,
  created_at timestamp with time zone default now()
);

create table public.outsourcer_contact_persons (
  id bigint primary key generated always as identity,
  outsourcer_id bigint not null references public.outsourcers (id),
  name text not null,
  role text,
  email text,
  phone_number text,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------

create table public.internal_operations (
  id bigint primary key generated always as identity,
  customer_name text,
  machine_number text,
  machine_code text,
  working_site_name text,
  start_date date,
  end_date date
);

create table public.outsource_operations (
  id bigint primary key generated always as identity,
  customer_name text,
  outsourcer_name text,
  machine_code text,
  working_site_name text,
  start_date date,
  end_date date
);

create table public.service_operations (
  id bigint primary key generated always as identity,
  machine_number text,
  type text,
  description text,
  created_at timestamp with time zone default now(),
  used_parts text
);

create table public.transportation_operations (
  transportation_op_id bigint primary key generated always as identity,
  plate_num text,
  starting_loc text,
  ending_loc text,
  date date,
  notes text
);

create table public.vehicles (
  id bigint primary key generated always as identity,
  plate_number text,
  vehicle_type text,
  examination_date date,
  insurance_date date,
  created_at timestamp with time zone default now()
);

create table public.operations_details (
  operation_id bigint primary key,
  operation_type text not null, -- 'internal', 'outsource', 'service', 'transportation'
  delivery_transportation bigint references public.transportation_operations (transportation_op_id),
  pickup_transportation bigint references public.transportation_operations (transportation_op_id),
  pricing_proposal text, -- PDF file path/URL
  image_delivery text, -- Image file path/URL
  image_pickup text, -- Image file path/URL
  invoice_operation text, -- Invoice information
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_operations_details_operation_type on public.operations_details (operation_type);
create index idx_operations_details_delivery_transportation on public.operations_details (delivery_transportation);
create index idx_operations_details_pickup_transportation on public.operations_details (pickup_transportation);

-- ---------------------------------------------------------------------------
-- Billing & invoicing
-- ---------------------------------------------------------------------------

create table public.bills (
  id bigint primary key generated always as identity,
  customer_name text,
  total_amount numeric,
  lines text,
  bill_date date,
  taxed boolean
);

create table public.bill_lines (
  id bigint primary key generated always as identity,
  bill_line_id bigint,
  customer_name text,
  type text,
  details text,
  unit_price numeric,
  amount numeric,
  total_price numeric,
  bill_id bigint references public.bills (id),
  operation_id bigint
);

create table public.bill_lines_rental (
  id bigint primary key generated always as identity,
  bill_line_id bigint,
  customer_name text,
  type text,
  details text,
  unit_price numeric,
  amount numeric,
  total_price numeric,
  bill_id bigint references public.bills (id),
  operation_id bigint,
  start_date date,
  end_date date
);

create table public.invoices (
  id bigint primary key generated always as identity,
  supplier_outsourcer_name text,
  total_amount numeric,
  lines text,
  bill_date date,
  taxed boolean
);

create table public.invoice_lines (
  id bigint primary key generated always as identity,
  bill_line_id bigint,
  supplier_outsourcer_name text,
  type text,
  details text,
  unit_price numeric,
  amount numeric,
  total_price numeric,
  bill_id bigint references public.invoices (id),
  operation_id bigint
);

create table public.invoice_lines_rental (
  id bigint primary key generated always as identity,
  bill_line_id bigint,
  supplier_outsourcer_name text,
  type text,
  details text,
  unit_price numeric,
  amount numeric,
  total_price numeric,
  bill_id bigint references public.invoices (id),
  operation_id bigint,
  start_date date,
  end_date date
);

create table public.outsource_invoice_lines (
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

-- ---------------------------------------------------------------------------
-- Collections & payments
-- ---------------------------------------------------------------------------

create table public.collections_check (
  collection_check_id bigint primary key generated always as identity,
  customer_name text,
  check_date date,
  amount numeric,
  collection_date date,
  account_name text,
  notes text
);

create table public.collection_credit_card (
  collection_credit_card_id bigint primary key generated always as identity,
  customer_name text,
  transaction_date date,
  amount numeric,
  payment_to text,
  credit_card_fee numeric,
  notes text
);

create table public.collection_cash (
  collection_cash_id bigint primary key generated always as identity,
  customer_name text,
  transaction_date date,
  amount numeric,
  account_name text,
  notes text
);

create table public.payments_check (
  payment_check_id bigint primary key generated always as identity,
  collector_name text,
  check_date date,
  amount numeric,
  collection_date date,
  account_name text,
  customer_name text,
  notes text
);

create table public.payment_credit_card (
  payment_credit_card_id bigint primary key generated always as identity,
  collector_name text,
  transaction_date date,
  amount numeric,
  payment_from text,
  credit_card_fee numeric,
  notes text,
  installment_period integer,
  customer_name text
);

create table public.payments_cash (
  payment_cash_id bigint primary key generated always as identity,
  collector_name text,
  transaction_date date,
  amount numeric,
  account_name text,
  customer_name text,
  notes text
);

create table public.accounts (
  account_id bigint primary key generated always as identity,
  type text,
  account_name text,
  balance numeric,
  created_at timestamp with time zone default now(),
  cutoff_day integer
);

-- ---------------------------------------------------------------------------
-- Personnel domain
-- ---------------------------------------------------------------------------

create table public.personel (
  personel_id bigint primary key generated always as identity,
  personel_name text not null,
  start_date date,
  end_date date,
  tc_kimlik text,
  birth_date date,
  role text,
  created_at timestamp with time zone default now()
);

create table public.personel_payments (
  personel_payment_id bigint primary key generated always as identity,
  personel_name text not null,
  payment_account text,
  amount numeric,
  date date,
  notes text,
  created_at timestamp with time zone default now()
);




