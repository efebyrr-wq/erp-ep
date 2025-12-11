# Balance Update Debugging Guide

## Current Status
All create methods now use case-insensitive lookups. Update methods still need to be fixed.

## How to Debug

1. **Check Backend Console Logs**
   When you save a payment/collection, you should see logs like:
   - `[createCheck] Looking for customer with name: "Customer Name"`
   - `[createCheck] Found customer: Customer Name, current balance: 1000.00`
   - `[createCheck] Updated customer Customer Name balance: 1000.00 -> 900.00`

2. **If you see "Customer not found"**
   - Check the exact customer name in the database
   - Verify the name matches exactly (case-insensitive now)
   - Check if there are extra spaces

3. **If you see "Skipping customer balance update"**
   - Check if `customerName` is being sent from frontend
   - Check if `amount` is being sent
   - Verify the form is submitting the correct data

4. **Check Database**
   - Verify the `balance` column exists and is numeric
   - Check if the customer/account exists
   - Verify the balance is actually being updated in the database

## Next Steps
- Fix all update methods to use case-insensitive lookups
- Add transaction support to ensure atomicity
- Add validation to ensure customer/account exists before updating





