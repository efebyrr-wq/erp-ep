const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com',
  port: 5432,
  database: 'erp-2025-db',
  user: 'postgres',
  password: 'gevnon-6Gihna-hentom',
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Create tax_payments table
    console.log('📋 Creating tax_payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tax_payments (
        tax_payment_id BIGSERIAL PRIMARY KEY,
        tax_type TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        payment_date DATE NOT NULL,
        account_id BIGINT NOT NULL,
        account_name TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_tax_payment_account
          FOREIGN KEY (account_id)
          REFERENCES public.accounts (account_id)
          ON DELETE RESTRICT
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);
    `);

    console.log('✅ tax_payments table created');

    // Step 2: Load seed data
    console.log('📋 Loading seed data...');
    const seedPath = path.join(__dirname, 'db', 'seed.sql');
    
    if (fs.existsSync(seedPath)) {
      const seedSQL = fs.readFileSync(seedPath, 'utf-8');
      
      // Split by semicolons and execute each statement
      const statements = seedSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('set '));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement.trim() + ';');
            successCount++;
          } catch (err) {
            // Ignore duplicate key errors (data already exists)
            if (err.message?.includes('duplicate key') || 
                err.message?.includes('already exists') ||
                err.message?.includes('violates unique constraint')) {
              // Silent ignore for duplicates
            } else {
              errorCount++;
              console.warn(`⚠️  Statement warning: ${err.message.substring(0, 100)}`);
            }
          }
        }
      }

      console.log(`✅ Seed data loaded: ${successCount} statements executed, ${errorCount} errors`);
    } else {
      console.warn(`⚠️  Seed file not found at ${seedPath}`);
    }

    await client.end();
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await client.end();
    process.exit(1);
  }
}

setupDatabase();


