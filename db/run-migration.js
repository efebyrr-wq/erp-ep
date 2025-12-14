// Simple script to run the migration to add missing columns to customers table
// Run with: node db/run-migration.js

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add missing columns
    const queries = [
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_number text;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS vergi_dairesi text;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS vkn text;`,
    ];

    for (const query of queries) {
      await client.query(query);
      console.log(`✓ Executed: ${query}`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();










