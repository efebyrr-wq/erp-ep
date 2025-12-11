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

// Tables in dependency order (child tables first for truncate, parent first for insert)
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

async function exportData() {
  console.log('📤 Connecting to local database...');
  const localDS = new DataSource(LOCAL_DB);
  await localDS.initialize();
  console.log('✅ Connected to local database');

  const sqlStatements = [];

  try {
    // Export data from each table
    console.log('\n📤 Exporting data from local database...');
    
    for (const table of tables.reverse()) { // Reverse to export parent tables first
      try {
        // Get identity columns for this table
        const identityCols = await localDS.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = $1 
            AND is_identity = 'YES'
        `, [table]);
        
        const identityColumnNames = new Set(identityCols.map(col => col.column_name));
        
        const rows = await localDS.query(`SELECT * FROM public.${table}`);
        
        if (rows.length === 0) {
          console.log(`   ⏭️  ${table}: no data`);
          continue;
        }

        // Get column names, excluding identity columns
        const allColumns = Object.keys(rows[0]);
        const columns = allColumns.filter(col => !identityColumnNames.has(col));
        
        if (columns.length === 0) {
          console.log(`   ⏭️  ${table}: only identity columns, skipping`);
          continue;
        }
        
        // Build INSERT statements
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return String(val);
          });
          
          const insertSQL = `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`;
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

