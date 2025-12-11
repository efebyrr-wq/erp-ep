#!/usr/bin/env node
/**
 * Export local PostgreSQL database and push to RDS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');

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

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'erp_2025';

const RDS_ENDPOINT = process.env.RDS_ENDPOINT || 'https://d31tialuhzl449.cloudfront.net';

async function main() {
  try {
    console.log('📤 Step 1: Exporting local database...');
    
    const exportFile = `/tmp/local-db-export-${Date.now()}.sql`;
    
    // Export database
    const pgDumpCmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p ${DB_PORT} -U "${DB_USERNAME}" -d "${DB_NAME}" --data-only --column-inserts --no-owner --no-privileges --no-tablespaces -f "${exportFile}"`;
    
    execSync(pgDumpCmd, { stdio: 'inherit' });
    
    if (!fs.existsSync(exportFile)) {
      throw new Error('Export file was not created');
    }
    
    const fileSize = fs.statSync(exportFile).size;
    console.log(`✅ Export completed: ${(fileSize / 1024).toFixed(2)} KB`);
    
    // Read SQL file
    console.log('📖 Step 2: Reading exported data...');
    const sqlData = fs.readFileSync(exportFile, 'utf-8');
    fs.unlinkSync(exportFile);
    
    if (!sqlData || sqlData.trim().length === 0) {
      throw new Error('Exported SQL file is empty. Make sure your local database has data.');
    }
    
    console.log(`✅ Read ${sqlData.length} characters of SQL data`);
    
    // Send to RDS endpoint
    console.log('📤 Step 3: Clearing RDS database and importing local data...');
    
    const url = new URL(`${RDS_ENDPOINT}/database/clear-and-import`);
    const postData = JSON.stringify({ sqlData });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const client = url.protocol === 'https:' ? https : http;
    
    const response = await new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(data),
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              body: data,
            });
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log('\n📊 Response:');
    console.log(JSON.stringify(response.body, null, 2));
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('\n✅ Process completed successfully!');
    } else {
      console.log('\n❌ Process completed with errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

