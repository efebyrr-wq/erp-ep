const fs = require('fs');
const path = require('path');

// Use pg from backend node_modules
const backendPath = path.join(__dirname, '..', 'backend');
const { Client } = require(path.join(backendPath, 'node_modules', 'pg'));

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
});

async function runSeed() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read and run schema.sql first
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running schema.sql...');
    await client.query(schemaSql);
    console.log('Schema created successfully!');

    // Read and run seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('Running seed.sql...');
    await client.query(seedSql);
    console.log('Seed data inserted successfully!');

    // Verify counts
    const tables = [
      'customers', 'contact_persons', 'working_sites', 'suppliers',
      'supplier_contact_persons', 'supplies', 'machinery', 'machinery_specs',
      'inventory', 'outsourcers', 'outsourcer_contact_persons', 'vehicles',
      'transportation_operations', 'internal_operations', 'outsource_operations',
      'service_operations', 'bills', 'bill_lines', 'invoices', 'invoice_lines',
      'collections_check', 'collection_credit_card', 'collection_cash',
      'payments_check', 'payment_credit_card', 'payments_cash', 'accounts'
    ];

    console.log('\nVerifying data counts:');
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  PostgreSQL is not running or not accessible.');
      console.error('   Please ensure PostgreSQL is running on localhost:5432');
      console.error('   and that the database "erp_2025" exists.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();

