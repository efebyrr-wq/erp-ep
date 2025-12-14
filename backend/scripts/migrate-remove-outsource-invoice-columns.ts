#!/usr/bin/env ts-node
/**
 * Migration script to remove columns from outsource_invoice_lines table:
 * - customer_name
 * - machine_code
 * - working_site_name
 * - start_date
 * - end_date
 * 
 * Run this script to update the RDS database schema.
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
  ssl: process.env.DB_HOST?.includes('rds') ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('🔄 Removing columns from outsource_invoice_lines table...');
    
    // Remove columns one by one (PostgreSQL doesn't support dropping multiple columns in one statement easily)
    const columnsToRemove = [
      'customer_name',
      'machine_code',
      'working_site_name',
      'start_date',
      'end_date',
    ];

    for (const column of columnsToRemove) {
      try {
        // Check if column exists before dropping
        const columnExists = await dataSource.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'outsource_invoice_lines' 
            AND column_name = $1
        `, [column]);

        if (columnExists.length > 0) {
          await dataSource.query(`
            ALTER TABLE public.outsource_invoice_lines 
            DROP COLUMN IF EXISTS ${column}
          `);
          console.log(`   ✅ Removed column: ${column}`);
        } else {
          console.log(`   ⏭️  Column ${column} does not exist, skipping`);
        }
      } catch (error) {
        console.error(`   ❌ Error removing column ${column}:`, error instanceof Error ? error.message : error);
        // Continue with other columns even if one fails
      }
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

migrate();

