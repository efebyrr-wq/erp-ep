-- Create operations_details table
create table if not exists public.operations_details (
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

-- Create indexes
create index if not exists idx_operations_details_operation_type on public.operations_details (operation_type);
create index if not exists idx_operations_details_delivery_transportation on public.operations_details (delivery_transportation);
create index if not exists idx_operations_details_pickup_transportation on public.operations_details (pickup_transportation);













