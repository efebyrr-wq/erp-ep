#!/usr/bin/env node
/**
 * Export local database using TypeORM and push to RDS via HTTP endpoint
 */

const { DataSource } = require('typeorm');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Load environment variables
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

const LOCAL_DB = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
  schema: 'public',
};

const RDS_ENDPOINT = process.env.RDS_ENDPOINT || 'https://d31tialuhzl449.cloudfront.net';

// Tables in dependency order for INSERT (parent tables first, then child tables)
// This ensures foreign keys exist before dependent records are inserted
const tables = [
  // Parent tables first (no foreign keys or only reference other parent tables)
  'accounts',
  'personel',
  'customers',
  'suppliers',
  'outsourcers',
  'working_sites',
  'machinery',
  'vehicles',
  'inventory',
  // Child tables (have foreign keys to parent tables above)
  'personel_details',
  'personel_payments',
  'contact_persons',
  'supplier_contact_persons',
  'supplies',
  'outsourcer_contact_persons',
  'machinery_specs', // References machinery
  'internal_operations', // References customers, machinery, working_sites
  'outsource_operations', // References customers, outsourcers, machinery, working_sites
  'service_operations', // References machinery
  'transportation_operations',
  'operations_details', // References operations
  'bills', // References customers
  'bill_lines', // References bills
  'bill_lines_rental', // References bill_lines
  'invoices', // References customers
  'invoice_lines', // References invoices
  'invoice_lines_rental', // References invoice_lines
  'outsource_invoice_lines', // References invoices
  'payments_check',
  'payments_cash',
  'payment_credit_card',
  'payment_cash',
  'collections_check',
  'collection_credit_card',
  'collection_cash',
  'tax_payments', // References accounts
];

async function exportData() {
  console.log('📤 Connecting to local database...');
  const localDS = new DataSource(LOCAL_DB);
  await localDS.initialize();
  console.log('✅ Connected to local database');

  const sqlStatements = [];

  try {
    // Export data from each table
    console.log('\n📤 Exporting data from local database...');
    
    for (const table of tables) { // Export in dependency order (parent first, then children)
      try {
        const rows = await localDS.query(`SELECT * FROM public.${table}`);
        
        if (rows.length === 0) {
          console.log(`   ⏭️  ${table}: no data`);
          continue;
        }

        // Get all columns from local data
        const allColumns = Object.keys(rows[0]);
        
        // Filter out columns that don't exist in RDS schema
        // Known problematic columns that exist in local but not in RDS
        const invalidColumns = new Set(['transportation_operation_id']);
        const validColumns = allColumns.filter(col => !invalidColumns.has(col));
        
        if (validColumns.length === 0) {
          console.log(`   ⏭️  ${table}: no valid columns for RDS, skipping`);
          continue;
        }
        
        // Build INSERT statements with only valid columns (that exist in RDS)
        for (const row of rows) {
          const values = validColumns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return String(val);
          });
          
          // Include ID columns to maintain foreign key relationships
          // Use OVERRIDING SYSTEM VALUE to allow inserting specific ID values
          const insertSQL = `INSERT INTO public.${table} (${validColumns.join(', ')}) OVERRIDING SYSTEM VALUE VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`;
          sqlStatements.push(insertSQL);
        }
        
        console.log(`   ✅ ${table}: ${rows.length} rows`);
      } catch (err) {
        if (!err.message?.includes('does not exist')) {
          console.log(`   ⚠️  Error exporting ${table}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Exported ${sqlStatements.length} INSERT statements`);
    return sqlStatements.join('\n');
  } finally {
    await localDS.destroy();
  }
}

async function pushToRDS(sqlData) {
  console.log('\n📤 Pushing data to RDS...');
  
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
  
  return new Promise((resolve, reject) => {
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
}

async function main() {
  try {
    const sqlData = await exportData();
    
    if (!sqlData || sqlData.trim().length === 0) {
      console.log('\n⚠️  No data to export. Make sure your local database has data.');
      return;
    }
    
    const response = await pushToRDS(sqlData);
    
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

