// Script to verify and log date formats in operations tables
// Run with: npx ts-node backend/scripts/verify-date-formats.ts

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

async function verifyDateFormats() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('\nVerifying date formats in operations tables...\n');

    // Check internal operations
    const internalOps = await client.query('SELECT id, start_date, end_date FROM internal_operations LIMIT 10');
    console.log('Internal Operations (sample):');
    internalOps.rows.forEach((op) => {
      console.log(`  ID: ${op.id}, Start: ${op.start_date}, End: ${op.end_date}`);
    });

    // Check outsource operations
    const outsourceOps = await client.query('SELECT id, start_date, end_date FROM outsource_operations LIMIT 10');
    console.log('\nOutsource Operations (sample):');
    outsourceOps.rows.forEach((op) => {
      console.log(`  ID: ${op.id}, Start: ${op.start_date}, End: ${op.end_date}`);
    });

    // Check transportation operations
    const transportOps = await client.query('SELECT transportation_op_id, date FROM transportation_operations LIMIT 10');
    console.log('\nTransportation Operations (sample):');
    transportOps.rows.forEach((op) => {
      console.log(`  ID: ${op.transportation_op_id}, Date: ${op.date}`);
    });

    console.log('\n✅ Date format verification complete.');
    console.log('Note: Dates in the database are stored as DATE type (YYYY-MM-DD).');
    console.log('The frontend will convert them to DD/MM/YYYY format for display.');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDateFormats();










