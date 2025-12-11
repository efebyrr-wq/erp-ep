-- Migration: Add latitude and longitude columns to machinery and working_sites tables
-- Run this script to add the new location columns

-- Add columns to machinery table
ALTER TABLE public.machinery 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Add columns to working_sites table
ALTER TABLE public.working_sites 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Update existing machinery to have garage coordinates if they are IDLE or have no status
UPDATE public.machinery 
SET latitude = 36.934308, longitude = 30.777931
WHERE (status IS NULL OR UPPER(TRIM(status)) = 'IDLE' OR status = '')
  AND (latitude IS NULL OR longitude IS NULL);





