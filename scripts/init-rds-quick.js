#!/usr/bin/env node

/**
 * Quick RDS database initialization (non-interactive)
 * Usage: node scripts/init-rds-quick.js <endpoint> <password> [username] [database]
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/init-rds-quick.js <endpoint> <password> [username] [database]');
    console.log('\nExample:');
    console.log('  node scripts/init-rds-quick.js erp-2025-db.xxx.rds.amazonaws.com mypassword');
    process.exit(1);
  }

  const endpoint = args[0];
  const password = args[1];
  const username = args[2] || 'postgres';
  const databaseName = args[3] || 'erp_2025';
  const port = 5432;

  console.log('🚀 RDS Database Initialization');
  console.log('==============================\n');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Username: ${username}`);
  console.log(`Database: ${databaseName}\n`);

  // Connect to default postgres database first
  const adminClient = new Client({
    host: endpoint,
    port: port,
    user: username,
    password: password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Connecting to RDS instance...');
    await adminClient.connect();
    console.log('✅ Connected successfully!\n');

    // Check if database already exists
    console.log('🔍 Checking if database exists...');
    const dbCheckResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    if (dbCheckResult.rows.length > 0) {
      console.log(`⚠️  Database '${databaseName}' already exists.`);
      console.log('   Skipping creation (database already exists).\n');
    } else {
      console.log(`📦 Creating database '${databaseName}'...`);
      await adminClient.query(`CREATE DATABASE ${databaseName}`);
      console.log(`✅ Database '${databaseName}' created successfully!\n`);
    }

    // Close admin connection
    await adminClient.end();

    // Connect to the new database
    const dbClient = new Client({
      host: endpoint,
      port: port,
      user: username,
      password: password,
      database: databaseName,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await dbClient.connect();
    console.log(`✅ Connected to database '${databaseName}'.\n`);

    // Check if schema file exists and run it
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Found schema.sql file.');
      console.log('🚀 Running schema.sql...\n');
      
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the entire schema
      try {
        await dbClient.query(schemaSQL);
        console.log('✅ Schema executed successfully!\n');
      } catch (error) {
        // Some errors are expected (like "table already exists")
        if (error.message.includes('already exists')) {
          console.log('⚠️  Some objects already exist (this is okay if re-running).\n');
        } else {
          console.error(`❌ Error executing schema: ${error.message}`);
          throw error;
        }
      }
    } else {
      console.log(`⚠️  Schema file not found at: ${schemaPath}`);
      console.log('   You can run it manually later.\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} tables:\n`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Schema may not have been executed.');
    }

    await dbClient.end();
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📝 Connection details for your application:');
    console.log(`   DB_HOST=${endpoint}`);
    console.log(`   DB_PORT=${port}`);
    console.log(`   DB_USERNAME=${username}`);
    console.log(`   DB_PASSWORD=${password}`);
    console.log(`   DB_NAME=${databaseName}`);
    console.log(`   DB_SCHEMA=public\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\n   Connection failed. Please check:');
      console.error('   - Endpoint URL is correct');
      console.error('   - Security group allows your IP address');
      console.error('   - Database status is "Available" in RDS Console');
      console.error('   - Password is correct');
    } else if (error.code === '28P01') {
      console.error('\n   Authentication failed. Please check:');
      console.error('   - Username is correct (default: postgres)');
      console.error('   - Password is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n   DNS resolution failed. Please check:');
      console.error('   - Endpoint URL is correct and complete');
    }
    process.exit(1);
  }
}

main();





