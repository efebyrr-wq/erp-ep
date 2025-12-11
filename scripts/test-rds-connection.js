#!/usr/bin/env node

/**
 * Simple RDS connection test
 */

const { Client } = require('pg');
const dns = require('dns').promises;

async function testConnection() {
  const endpoint = 'erp-2025-db.cb4eq8qaqm7h.eu-north-1.rds.amazonaws.com';
  const password = process.env.DB_PASSWORD || 'gevnon-6Gihna-hentom';
  
  console.log('🔍 Testing RDS Connection');
  console.log('==========================\n');
  console.log(`Endpoint: ${endpoint}`);
  
  // Test DNS resolution
  try {
    console.log('\n1. Testing DNS resolution...');
    const addresses = await dns.resolve4(endpoint);
    console.log(`✅ DNS resolved to: ${addresses.join(', ')}`);
  } catch (error) {
    console.error(`❌ DNS resolution failed: ${error.message}`);
    return;
  }
  
  // Test TCP connection (basic connectivity)
  console.log('\n2. Testing TCP connectivity...');
  const net = require('net');
  const [host, port] = [endpoint, 5432];
  
  await new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      console.log('✅ TCP connection successful!');
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
    
    socket.connect(port, host);
  }).catch(error => {
    console.error(`❌ TCP connection failed: ${error.message}`);
    console.error('\n   This usually means:');
    console.error('   - Security group is blocking the connection');
    console.error('   - Database is not in "Available" status');
    console.error('   - Network firewall is blocking port 5432');
    return;
  });
  
  // Test PostgreSQL connection
  console.log('\n3. Testing PostgreSQL authentication...');
  const client = new Client({
    host: endpoint,
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log(`✅ Database version: ${result.rows[0].version.split(',')[0]}`);
    
    await client.end();
    console.log('\n🎉 All connection tests passed!');
  } catch (error) {
    console.error(`❌ PostgreSQL connection failed: ${error.message}`);
    if (error.code === '28P01') {
      console.error('   Authentication failed - check username and password');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timeout - check security group settings');
    }
  }
}

testConnection().catch(console.error);





