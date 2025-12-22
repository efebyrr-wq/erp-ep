-- Create operations_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.operations_details (
  operation_id bigint PRIMARY KEY,
  operation_type text NOT NULL, -- 'internal', 'outsource', 'service', 'transportation'
  delivery_transportation bigint REFERENCES public.transportation_operations (transportation_op_id),
  pickup_transportation bigint REFERENCES public.transportation_operations (transportation_op_id),
  pricing_proposal text, -- PDF file path/URL (legacy)
  image_delivery text, -- Image file path/URL (legacy)
  image_pickup text, -- Image file path/URL (legacy)
  invoice_operation text, -- Invoice information (legacy)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add binary storage columns if they don't exist
ALTER TABLE public.operations_details 
  ADD COLUMN IF NOT EXISTS pricing_proposal_pdf BYTEA,
  ADD COLUMN IF NOT EXISTS invoice_pdf BYTEA,
  ADD COLUMN IF NOT EXISTS image_delivery_bundle JSONB,
  ADD COLUMN IF NOT EXISTS image_pickup_bundle JSONB;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_operations_details_operation_type ON public.operations_details (operation_type);
CREATE INDEX IF NOT EXISTS idx_operations_details_delivery_transportation ON public.operations_details (delivery_transportation);
CREATE INDEX IF NOT EXISTS idx_operations_details_pickup_transportation ON public.operations_details (pickup_transportation);











