-- Check for any unique constraints or indexes on transportation_operation_id
-- Run this to verify there are no constraints preventing multiple operations with the same transportation ID

-- Check for unique constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('internal_operations', 'outsource_operations')
  AND kcu.column_name = 'transportation_operation_id'
  AND tc.constraint_type = 'UNIQUE';

-- Check for indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('internal_operations', 'outsource_operations')
  AND indexdef LIKE '%transportation_operation_id%';

-- If any constraints are found, remove them with:
-- ALTER TABLE public.internal_operations DROP CONSTRAINT IF EXISTS constraint_name;
-- ALTER TABLE public.outsource_operations DROP CONSTRAINT IF EXISTS constraint_name;





