-- Add new columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS vergi_dairesi text,
ADD COLUMN IF NOT EXISTS vkn text;

-- Remove transportation_operation_id from internal_operations
ALTER TABLE public.internal_operations 
DROP COLUMN IF EXISTS transportation_operation_id;

-- Remove transportation_operation_id from outsource_operations
ALTER TABLE public.outsource_operations 
DROP COLUMN IF EXISTS transportation_operation_id;











