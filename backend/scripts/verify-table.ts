import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env.development') });

async function verifyTable() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_2025',
    schema: process.env.DB_SCHEMA || 'public',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Check if table exists
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'outsource_invoice_lines'
      )
    `);
    
    console.log('Table exists:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // Get all outsource invoice lines
      const lines = await dataSource.query(`
        SELECT * FROM public.outsource_invoice_lines 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log(`\n📋 Found ${lines.length} outsource invoice line(s):`);
      lines.forEach((line, index) => {
        console.log(`\nLine ${index + 1}:`);
        console.log(`  ID: ${line.id}`);
        console.log(`  Bill ID: ${line.bill_id}`);
        console.log(`  Outsourcer: ${line.outsourcer_name}`);
        console.log(`  Customer: ${line.customer_name}`);
        console.log(`  Machine Code: ${line.machine_code}`);
        console.log(`  Type: ${line.type}`);
        console.log(`  Total Price: ${line.total_price}`);
        console.log(`  Start Date: ${line.start_date}`);
        console.log(`  End Date: ${line.end_date}`);
      });
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyTable();












