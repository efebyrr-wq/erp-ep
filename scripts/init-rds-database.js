#!/usr/bin/env node

/**
 * Script to initialize RDS database
 * Usage: node scripts/init-rds-database.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 RDS Database Initialization Script');
  console.log('=====================================\n');

  // Get connection details
  const endpoint = await question('RDS Endpoint (or press Enter for default): ') || 
    'erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com';
  
  const username = await question('Username (default: postgres): ') || 'postgres';
  const password = await question('Password: ');
  const databaseName = await question('Database name to create (default: erp_2025): ') || 'erp_2025';
  const port = await question('Port (default: 5432): ') || '5432';

  if (!password) {
    console.error('❌ Password is required!');
    process.exit(1);
  }

  // Connect to default postgres database first
  const adminClient = new Client({
    host: endpoint,
    port: parseInt(port),
    user: username,
    password: password,
    database: 'postgres', // Connect to default postgres database
    ssl: {
      rejectUnauthorized: false // RDS uses SSL
    }
  });

  try {
    console.log('\n📡 Connecting to RDS instance...');
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
      const overwrite = await question('Do you want to drop and recreate it? (yes/no): ');
      if (overwrite.toLowerCase() === 'yes') {
        console.log(`🗑️  Dropping existing database '${databaseName}'...`);
        // Terminate existing connections first
        await adminClient.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [databaseName]
        );
        await adminClient.query(`DROP DATABASE ${databaseName}`);
        console.log('✅ Database dropped.\n');
      } else {
        console.log('⏭️  Skipping database creation.\n');
      }
    }

    // Create database if it doesn't exist
    if (dbCheckResult.rows.length === 0 || (await question('Create database? (yes/no): ')).toLowerCase() === 'yes') {
      console.log(`📦 Creating database '${databaseName}'...`);
      await adminClient.query(`CREATE DATABASE ${databaseName}`);
      console.log(`✅ Database '${databaseName}' created successfully!\n`);
    }

    // Close admin connection
    await adminClient.end();

    // Connect to the new database
    const dbClient = new Client({
      host: endpoint,
      port: parseInt(port),
      user: username,
      password: password,
      database: databaseName,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await dbClient.connect();
    console.log(`✅ Connected to database '${databaseName}'.\n`);

    // Check if schema file exists
    const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Found schema.sql file.');
      const runSchema = await question('Do you want to run the schema? (yes/no): ');
      
      if (runSchema.toLowerCase() === 'yes') {
        console.log('🚀 Running schema.sql...\n');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema (split by semicolons for better error handling)
        const statements = schemaSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
          try {
            await dbClient.query(statement);
            successCount++;
          } catch (error) {
            // Some errors are expected (like "table already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist')) {
              // These are usually fine for idempotent operations
              successCount++;
            } else {
              console.error(`⚠️  Error executing statement: ${error.message}`);
              errorCount++;
            }
          }
        }

        console.log(`\n✅ Schema execution completed!`);
        console.log(`   Successful: ${successCount}, Errors: ${errorCount}\n`);
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
    if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. Check:');
      console.error('   - Endpoint URL is correct');
      console.error('   - Security group allows your IP');
      console.error('   - Database status is "Available"');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed. Check username and password.');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

