-- Migration: Add binary storage for PDFs and images in operations_details
-- This migration changes text columns to BYTEA for binary data storage

-- Add new columns for binary data
ALTER TABLE public.operations_details 
  ADD COLUMN IF NOT EXISTS pricing_proposal_pdf BYTEA,
  ADD COLUMN IF NOT EXISTS invoice_pdf BYTEA,
  ADD COLUMN IF NOT EXISTS image_delivery_bundle JSONB, -- Array of BYTEA images
  ADD COLUMN IF NOT EXISTS image_pickup_bundle JSONB;   -- Array of BYTEA images

-- Note: The old text columns (pricing_proposal, image_delivery, image_pickup, invoice_operation)
-- are kept for backward compatibility. You can migrate existing data if needed:
-- 
-- To migrate existing text paths to binary (if you have files):
-- UPDATE operations_details SET pricing_proposal_pdf = pg_read_binary_file(pricing_proposal) 
-- WHERE pricing_proposal IS NOT NULL AND pricing_proposal LIKE '/%';
--
-- After migration, you can drop the old columns:
-- ALTER TABLE public.operations_details 
--   DROP COLUMN IF EXISTS pricing_proposal,
--   DROP COLUMN IF EXISTS image_delivery,
--   DROP COLUMN IF EXISTS image_pickup,
--   DROP COLUMN IF EXISTS invoice_operation;









