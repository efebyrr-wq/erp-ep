#!/usr/bin/env node

const { Client } = require('pg');
const net = require('net');

async function test() {
  const endpoint = 'erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com';
  const password = 'gevnon-6Gihna-hentom';
  
  console.log('🔍 Detailed RDS Connection Test');
  console.log('================================\n');
  
  // Test 1: Basic TCP connection with longer timeout
  console.log('Test 1: TCP Connection (30 second timeout)...');
  await new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(30000);
    
    socket.once('connect', () => {
      console.log('✅ TCP connection successful!');
      socket.destroy();
      resolve();
    });
    
    socket.once('timeout', () => {
      console.log('❌ TCP connection timeout after 30 seconds');
      socket.destroy();
      reject(new Error('Timeout'));
    });
    
    socket.once('error', (err) => {
      console.log(`❌ TCP connection error: ${err.message} (code: ${err.code})`);
      socket.destroy();
      reject(err);
    });
    
    console.log(`   Attempting to connect to ${endpoint}:5432...`);
    socket.connect(5432, endpoint);
  }).catch(() => {
    console.log('   TCP connection failed\n');
  });
  
  // Test 2: PostgreSQL connection with SSL
  console.log('\nTest 2: PostgreSQL Connection with SSL...');
  const client = new Client({
    host: endpoint,
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 10000
  });
  
  try {
    console.log('   Attempting PostgreSQL connection...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    const result = await client.query('SELECT version(), current_database()');
    console.log(`✅ Connected to: ${result.rows[0].current_database}`);
    console.log(`✅ Version: ${result.rows[0].version.split(',')[0]}\n`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ PostgreSQL connection failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}\n`);
    return false;
  }
}

test().then(success => {
  if (success) {
    console.log('🎉 All tests passed! Ready to initialize database.');
    process.exit(0);
  } else {
    console.log('⚠️  Connection tests failed. Please check:');
    console.log('   1. Security group inbound rules');
    console.log('   2. Network ACLs (if using custom VPC)');
    console.log('   3. Local firewall settings');
    console.log('   4. Database status in AWS Console');
    process.exit(1);
  }
}).catch(console.error);






