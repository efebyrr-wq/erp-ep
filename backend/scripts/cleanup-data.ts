// Script to delete operations, customers, payments, and suppliers data
// Keeps machinery data intact
// Run with: npx ts-node backend/scripts/cleanup-data.ts

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
});

async function tableExists(tableName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function deleteFromTable(tableName: string, description: string): Promise<number> {
  const exists = await tableExists(tableName);
  if (!exists) {
    console.log(`  ⚠ Table ${tableName} does not exist, skipping...`);
    return 0;
  }
  const result = await client.query(`DELETE FROM ${tableName}`);
  console.log(`  ✓ Deleted ${result.rowCount} ${description} records`);
  return result.rowCount;
}

async function cleanupData() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('Starting data cleanup...\n');

    // Delete in order to respect foreign key constraints
    
    // 1. Delete invoice lines and bill lines first (they reference operations)
    console.log('Deleting invoice and bill lines...');
    await deleteFromTable('outsource_invoice_lines', 'outsource_invoice_lines');
    await deleteFromTable('invoice_lines_rental', 'invoice_lines_rental');
    await deleteFromTable('invoice_lines', 'invoice_lines');
    await deleteFromTable('bill_lines_rental', 'bill_lines_rental');
    await deleteFromTable('bill_lines', 'bill_lines');

    // 2. Delete operations_details (references operations)
    console.log('\nDeleting operations_details...');
    await deleteFromTable('operations_details', 'operations_details');

    // 3. Delete operations
    console.log('\nDeleting operations...');
    await deleteFromTable('internal_operations', 'internal_operations');
    await deleteFromTable('outsource_operations', 'outsource_operations');
    await deleteFromTable('service_operations', 'service_operations');
    await deleteFromTable('transportation_operations', 'transportation_operations');

    // 4. Delete payments
    console.log('\nDeleting payments...');
    await deleteFromTable('payments_check', 'payments_check');
    await deleteFromTable('payment_credit_card', 'payment_credit_card');
    await deleteFromTable('payments_cash', 'payments_cash');

    // 5. Delete collections
    console.log('\nDeleting collections...');
    await deleteFromTable('collections_check', 'collections_check');
    await deleteFromTable('collection_credit_card', 'collection_credit_card');
    await deleteFromTable('collection_cash', 'collection_cash');

    // 6. Delete bills (related to customers)
    console.log('\nDeleting bills...');
    await deleteFromTable('bills', 'bills');

    // 7. Delete invoices (related to suppliers)
    console.log('\nDeleting invoices...');
    await deleteFromTable('invoices', 'invoices');

    // 8. Delete contact_persons (related to customers)
    console.log('\nDeleting contact_persons...');
    await deleteFromTable('contact_persons', 'contact_persons');

    // 9. Delete customers
    console.log('\nDeleting customers...');
    await deleteFromTable('customers', 'customers');

    // 10. Delete supplier_contact_persons (related to suppliers)
    console.log('\nDeleting supplier_contact_persons...');
    await deleteFromTable('supplier_contact_persons', 'supplier_contact_persons');

    // 11. Delete supplies (related to suppliers)
    console.log('\nDeleting supplies...');
    await deleteFromTable('supplies', 'supplies');

    // 12. Delete suppliers
    console.log('\nDeleting suppliers...');
    await deleteFromTable('suppliers', 'suppliers');

    console.log('\n✅ Data cleanup completed successfully!');
    console.log('✓ Operations data deleted');
    console.log('✓ Customers data deleted');
    console.log('✓ Payments data deleted');
    console.log('✓ Suppliers data deleted');
    console.log('✓ Machinery data kept intact');
  } catch (error) {
    console.error('❌ Cleanup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupData();

