import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env.development') });

async function createTable() {
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

    const queryRunner = dataSource.createQueryRunner();
    
    // Check if table exists
    const tableExists = await queryRunner.hasTable('outsource_invoice_lines');
    
    if (tableExists) {
      console.log('ℹ️  Table outsource_invoice_lines already exists');
    } else {
      console.log('📝 Creating outsource_invoice_lines table...');
      
      await queryRunner.query(`
        create table public.outsource_invoice_lines (
          id bigint primary key generated always as identity,
          bill_id bigint references public.invoices (id) on delete cascade,
          outsource_operation_id bigint references public.outsource_operations (id),
          outsourcer_name text,
          customer_name text,
          machine_code text,
          working_site_name text,
          type text,
          details text,
          unit_price numeric,
          amount numeric,
          total_price numeric,
          start_date date,
          end_date date,
          created_at timestamp with time zone default now()
        )
      `);

      await queryRunner.query(`
        create index if not exists idx_outsource_invoice_lines_bill_id 
        on public.outsource_invoice_lines(bill_id)
      `);

      await queryRunner.query(`
        create index if not exists idx_outsource_invoice_lines_operation_id 
        on public.outsource_invoice_lines(outsource_operation_id)
      `);

      console.log('✅ Table outsource_invoice_lines created successfully');
    }

    await dataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

createTable();














