#!/usr/bin/env node
/**
 * Copy data from local PostgreSQL to RDS using TypeORM
 */

const { DataSource } = require('typeorm');
const fs = require('fs');

// Load environment variables from backend/.env
function loadEnv() {
  const envPath = './backend/.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

// Get RDS credentials from environment (set these or they'll use defaults)
const LOCAL_DB = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
  schema: 'public',
};

const RDS_DB = {
  type: 'postgres',
  host: process.env.RDS_HOST || process.env.DB_HOST_RDS,
  port: parseInt(process.env.RDS_PORT || process.env.DB_PORT_RDS || '5432'),
  username: process.env.RDS_USERNAME || process.env.DB_USERNAME_RDS || 'postgres',
  password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD_RDS,
  database: process.env.RDS_DATABASE || process.env.DB_NAME_RDS || 'erp_2025',
  schema: 'public',
  ssl: { rejectUnauthorized: false },
};

async function main() {
  if (!RDS_DB.host || !RDS_DB.password) {
    console.error('❌ RDS credentials not found. Please set:');
    console.error('   RDS_HOST, RDS_PORT, RDS_USERNAME, RDS_PASSWORD, RDS_DATABASE');
    console.error('   OR');
    console.error('   DB_HOST_RDS, DB_PORT_RDS, DB_USERNAME_RDS, DB_PASSWORD_RDS, DB_NAME_RDS');
    process.exit(1);
  }

  console.log('📤 Connecting to local database...');
  const localDS = new DataSource(LOCAL_DB);
  await localDS.initialize();
  console.log('✅ Connected to local database');

  console.log('📤 Connecting to RDS database...');
  const rdsDS = new DataSource(RDS_DB);
  await rdsDS.initialize();
  console.log('✅ Connected to RDS database');

  // Tables in dependency order (child tables first)
  const tables = [
    'tax_payments',
    'outsource_invoice_lines',
    'invoice_lines_rental',
    'invoice_lines',
    'invoices',
    'bill_lines_rental',
    'bill_lines',
    'bills',
    'collection_cash',
    'collection_credit_card',
    'collections_check',
    'payment_cash',
    'payment_credit_card',
    'payments_cash',
    'payments_check',
    'service_operations',
    'internal_operations',
    'outsource_operations',
    'transportation_operations',
    'operations_details',
    'machinery_specs',
    'machinery',
    'vehicles',
    'supplier_contact_persons',
    'supplies',
    'suppliers',
    'outsourcer_contact_persons',
    'outsourcers',
    'inventory',
    'working_sites',
    'contact_persons',
    'customers',
    'personel_payments',
    'personel_details',
    'personel',
    'accounts',
  ];

  try {
    // Disable foreign key checks on RDS
    await rdsDS.query('SET session_replication_role = replica;');

    // Clear all tables in RDS
    console.log('\n🗑️  Clearing RDS database...');
    for (const table of tables) {
      try {
        await rdsDS.query(`TRUNCATE TABLE public.${table} CASCADE;`);
        console.log(`   ✅ Cleared ${table}`);
      } catch (err) {
        if (!err.message?.includes('does not exist')) {
          console.log(`   ⚠️  Could not clear ${table}: ${err.message}`);
        }
      }
    }

    // Re-enable foreign key checks
    await rdsDS.query('SET session_replication_role = DEFAULT;');

    // Copy data from local to RDS
    console.log('\n📤 Copying data from local to RDS...');
    let totalRows = 0;

    for (const table of tables.reverse()) { // Reverse to copy parent tables first
      try {
        // Get all data from local
        const rows = await localDS.query(`SELECT * FROM public.${table}`);
        
        if (rows.length === 0) {
          console.log(`   ⏭️  ${table}: no data`);
          continue;
        }

        // Get column names
        const columns = Object.keys(rows[0]);
        
        // Build INSERT statements
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return String(val);
          });
          
          const insertSQL = `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`;
          
          try {
            await rdsDS.query(insertSQL);
            totalRows++;
          } catch (err) {
            // Ignore duplicate key errors
            if (!err.message?.includes('duplicate key') && 
                !err.message?.includes('violates unique constraint')) {
              console.log(`   ⚠️  Error inserting into ${table}: ${err.message.substring(0, 100)}`);
            }
          }
        }
        
        console.log(`   ✅ ${table}: ${rows.length} rows`);
      } catch (err) {
        if (!err.message?.includes('does not exist')) {
          console.log(`   ⚠️  Error copying ${table}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Copied ${totalRows} total rows to RDS`);

    // Verify
    const customerCount = await rdsDS.query('SELECT COUNT(*) as count FROM customers');
    const accountCount = await rdsDS.query('SELECT COUNT(*) as count FROM accounts');
    console.log(`\n📊 Verification: ${customerCount[0]?.count || 0} customers, ${accountCount[0]?.count || 0} accounts`);

  } finally {
    await localDS.destroy();
    await rdsDS.destroy();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

