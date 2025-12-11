# Binary Storage Implementation for Operation Details

## Overview
This implementation allows storing PDFs and image bundles directly in the PostgreSQL database using BYTEA columns for binary data.

## Database Changes

### Migration Script
Run the migration script to add binary storage columns:
```bash
psql postgresql://<user>:<password>@localhost:5432/erp_2025 -f db/migrations/add_binary_storage_to_operations_details.sql
```

### New Columns
- `pricing_proposal_pdf` (BYTEA) - Stores PDF binary data
- `invoice_pdf` (BYTEA) - Stores invoice PDF binary data  
- `image_delivery_bundle` (JSONB) - Stores array of base64-encoded images with metadata
- `image_pickup_bundle` (JSONB) - Stores array of base64-encoded images with metadata

### Legacy Columns (Kept for Backward Compatibility)
- `pricing_proposal` (text) - Legacy PDF path/URL
- `image_delivery` (text) - Legacy image path/URL
- `image_pickup` (text) - Legacy image path/URL
- `invoice_operation` (text) - Legacy invoice info

## Backend Changes

### Entity (`operation-details.entity.ts`)
- Added Buffer type columns for PDFs
- Added JSONB columns for image bundles
- Legacy text columns maintained for compatibility

### DTOs
- `CreateOperationDetailsDto` and `UpdateOperationDetailsDto` now accept:
  - `pricingProposalPdf`: base64 string
  - `invoicePdf`: base64 string
  - `imageDeliveryBundle`: Array of `{data: string, mimeType: string, filename?: string}`
  - `imagePickupBundle`: Array of `{data: string, mimeType: string, filename?: string}`

### Service
- Converts base64 strings to Buffer for storage
- Converts Buffer to base64 for API responses

### Controller
- Transforms Buffer data to base64 in responses for JSON compatibility

## Frontend Changes

### Types
- Updated `OperationDetails` type to include binary fields
- Added `ImageBundleItem` type

### OperationsPage
- Added file upload inputs for PDFs and image bundles
- Added display components for existing PDFs and images
- Converts files to base64 before sending to backend
- Preserves existing binary data when updating (if no new file uploaded)

## Usage

### Uploading Files
1. Open operation details modal
2. Select PDF files for "Pricing Proposal PDF" or "Invoice PDF"
3. Select multiple images for "Image Delivery Bundle" or "Image Pickup Bundle"
4. Save - files are automatically converted to base64 and stored in database

### Viewing Files
- Existing PDFs show as clickable links that open in new tab
- Existing images display as thumbnails in the form
- Newly selected files show file count before saving

## Notes

- **Database Size**: Storing binary data in database can significantly increase database size. Monitor database growth.
- **Performance**: Large files may impact query performance. Consider file size limits.
- **Base64 Overhead**: Base64 encoding increases size by ~33%. Consider compression for large files.
- **Migration**: Existing text-based paths are preserved. You can migrate them later if needed.

## Future Enhancements

1. Add file size validation
2. Add image compression before storage
3. Add PDF preview in modal
4. Add image gallery view
5. Integrate with PDF generation forms to auto-save PDFs








