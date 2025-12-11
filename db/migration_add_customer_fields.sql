-- Migration: Add phone_number, address, email, vergi_dairesi, vkn to customers table
-- Run this if your customers table is missing these columns

set search_path to public;

-- Add missing columns to customers table if they don't exist
DO $$
BEGIN
  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN phone_number text;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN address text;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN email text;
  END IF;

  -- Add vergi_dairesi column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'vergi_dairesi'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN vergi_dairesi text;
  END IF;

  -- Add vkn column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'vkn'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN vkn text;
  END IF;
END $$;









