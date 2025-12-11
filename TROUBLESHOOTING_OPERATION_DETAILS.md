# Troubleshooting Operation Details

## Issue: Data not showing after save

### Steps to Fix:

1. **Run Database Migration**
   The database needs the new binary columns. Run:
   ```bash
   ./check_and_migrate_db.sh
   ```
   Or manually:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/erp_2025 -f db/migrations/add_binary_storage_to_operations_details.sql
   ```

2. **Check Backend Logs**
   The backend now has console logging. Check the terminal where the backend is running for:
   - "Creating operation details: ..."
   - "Operation details saved successfully: ..."
   - "Fetching operation details for: ..."
   - "Operation details found: ..."

3. **Check Frontend Console**
   Open browser DevTools (F12) and check the Console tab for:
   - "Saving operation details: ..."
   - "Operation details saved: ..."
   - "Fetching operation details for: ..."
   - "Fetched operation details: ..."

4. **Verify Database Columns**
   Check if the columns exist:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'operations_details' 
   AND column_name IN ('pricing_proposal_pdf', 'invoice_pdf', 'image_delivery_bundle', 'image_pickup_bundle');
   ```

5. **Check Saved Data**
   Query the database directly:
   ```sql
   SELECT 
     operation_id,
     operation_type,
     CASE WHEN pricing_proposal_pdf IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pricing_pdf,
     CASE WHEN invoice_pdf IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as invoice_pdf,
     jsonb_array_length(image_delivery_bundle) as delivery_images_count,
     jsonb_array_length(image_pickup_bundle) as pickup_images_count
   FROM operations_details;
   ```

## What to Look For:

1. **After Saving:**
   - Check backend logs for "Operation details saved successfully"
   - Check frontend console for "Operation details saved"
   - The form should show "View Existing PDF" links if PDFs were saved
   - The form should show image thumbnails if images were saved

2. **After Opening Details Again:**
   - Check backend logs for "Fetching operation details for: [id]"
   - Check backend logs for "Operation details found: ..."
   - Check frontend console for "Fetched operation details: ..."
   - The form should populate with saved data

## Common Issues:

1. **Database columns don't exist**
   - Solution: Run the migration script

2. **Data saved but not displayed**
   - Check if `operationDetails` state is being set
   - Check if the form is checking `operationDetails?.pricingProposalPdf`

3. **Error saving**
   - Check backend error logs
   - Check if base64 conversion is working
   - Check if file size is too large

4. **Form closes after save**
   - The form now stays open to show saved data
   - Check if `setOperationDetails` is being called








