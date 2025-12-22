import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });
config({ path: '.env.development' });

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

    // Create table if it doesn't exist
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS public.operations_details (
        operation_id bigint PRIMARY KEY,
        operation_type text NOT NULL,
        delivery_transportation bigint REFERENCES public.transportation_operations (transportation_op_id),
        pickup_transportation bigint REFERENCES public.transportation_operations (transportation_op_id),
        pricing_proposal text,
        image_delivery text,
        image_pickup text,
        invoice_operation text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `);
    console.log('✅ Created operations_details table');

    // Add binary storage columns if they don't exist
    await dataSource.query(`
      ALTER TABLE public.operations_details 
        ADD COLUMN IF NOT EXISTS pricing_proposal_pdf BYTEA,
        ADD COLUMN IF NOT EXISTS invoice_pdf BYTEA,
        ADD COLUMN IF NOT EXISTS image_delivery_bundle JSONB,
        ADD COLUMN IF NOT EXISTS image_pickup_bundle JSONB;
    `);
    console.log('✅ Added binary storage columns');

    // Create indexes if they don't exist
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_operations_details_operation_type 
        ON public.operations_details (operation_type);
      CREATE INDEX IF NOT EXISTS idx_operations_details_delivery_transportation 
        ON public.operations_details (delivery_transportation);
      CREATE INDEX IF NOT EXISTS idx_operations_details_pickup_transportation 
        ON public.operations_details (pickup_transportation);
    `);
    console.log('✅ Created indexes');

    console.log('\n✅ Successfully set up operations_details table!');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating table:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

createTable();











