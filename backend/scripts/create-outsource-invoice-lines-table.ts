import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';

async function createTable() {
  const configService = new ConfigService();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: Number(configService.get<number>('DB_PORT', 5432)),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'erp_2025'),
    schema: configService.get<string>('DB_SCHEMA', 'public'),
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

// Load environment variables
ConfigModule.forRoot({
  envFilePath: ['.env', '.env.local', '.env.development'],
});

createTable();












