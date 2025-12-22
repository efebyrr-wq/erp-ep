import { Controller, Post, Logger, Body } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('database')
export class DatabaseSetupController {
  private readonly logger = new Logger(DatabaseSetupController.name);

  constructor(private dataSource: DataSource) {}

  @Post('setup')
  async setupDatabase() {
    try {
      this.logger.log('Starting database setup...');

      // Create tax_payments table
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS public.tax_payments (
          tax_payment_id BIGSERIAL PRIMARY KEY,
          tax_type TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          payment_date DATE NOT NULL,
          account_id BIGINT NOT NULL,
          account_name TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_tax_payment_account
            FOREIGN KEY (account_id)
            REFERENCES public.accounts (account_id)
            ON DELETE RESTRICT
        );
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);
      `);

      this.logger.log('✅ Created tax_payments table');

      // Note: Seed data loading is disabled by default
      // Use /database/clear-and-import endpoint to load your own data
      // If you need to load seed data, uncomment the section below
      
      let seedSQL: string | null = null;
      
      /*
      // Load seed data
      // Try multiple paths: dist folder (production) or parent db folder (development)
      const seedPaths = [
        join(process.cwd(), 'dist', 'seed.sql'),
        join(process.cwd(), '..', 'db', 'seed.sql'),
        join(__dirname, '..', '..', '..', 'db', 'seed.sql'),
      ];
      
      for (const seedPath of seedPaths) {
        try {
          seedSQL = readFileSync(seedPath, 'utf-8');
          this.logger.log(`✅ Found seed file at: ${seedPath}`);
          break;
        } catch (err) {
          // Try next path
        }
      }
      
      if (!seedSQL) {
        throw new Error('Could not find seed.sql file in any expected location');
      }
      */
      
      // Variables to track execution
      let executedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Execute SQL statements properly handling multi-line INSERTs
      // Use a simple state machine to track when we're inside quotes/parentheses
      if (!seedSQL) {
        this.logger.log('⚠️  Seed data loading is disabled. Use /database/clear-and-import to load your data.');
      } else {
        try {
          this.logger.log('Parsing and executing seed SQL file...');
          
          // Remove comment lines
          const sqlContent: string = seedSQL;
          const lines = sqlContent.split('\n').filter(line => !line.trim().startsWith('--'));
          const cleanSQL = lines.join('\n');
        
        // Split by semicolon, but only when not inside quotes or parentheses
        const statements: string[] = [];
        let currentStatement = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let parenDepth = 0;
        
        for (let i = 0; i < cleanSQL.length; i++) {
          const char = cleanSQL[i];
          const prevChar = i > 0 ? cleanSQL[i - 1] : '';
          
          // Track quote state (handle escaped quotes)
          if (char === "'" && prevChar !== '\\') {
            inSingleQuote = !inSingleQuote;
          } else if (char === '"' && prevChar !== '\\') {
            inDoubleQuote = !inDoubleQuote;
          } else if (!inSingleQuote && !inDoubleQuote) {
            if (char === '(') {
              parenDepth++;
            } else if (char === ')') {
              parenDepth--;
            } else if (char === ';' && parenDepth === 0) {
              // Found a statement terminator
              const stmt = currentStatement.trim();
              if (stmt && !stmt.toLowerCase().startsWith('set ')) {
                statements.push(stmt);
              }
              currentStatement = '';
              continue;
            }
          }
          
          currentStatement += char;
        }
        
        // Add the last statement if any
        const lastStmt = currentStatement.trim();
        if (lastStmt && !lastStmt.toLowerCase().startsWith('set ')) {
          statements.push(lastStmt);
        }
        
        this.logger.log(`Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (!statement) continue;
          
          try {
            await this.dataSource.query(statement);
            executedCount++;
            if (i < 3) {
              this.logger.log(`✅ Executed statement ${i + 1} (${statement.substring(0, 50)}...)`);
            }
          } catch (err: any) {
            // Ignore duplicate key errors (data already exists)
            if (err.message?.includes('duplicate key') || 
                err.message?.includes('violates unique constraint') ||
                err.message?.includes('already exists')) {
              // Silent ignore
            } else {
              errorCount++;
              const errorMsg = `Statement ${i + 1}: ${err.message?.substring(0, 150)}`;
              errors.push(errorMsg);
              this.logger.warn(`⚠️  ${errorMsg}`);
              // Log first few characters of the statement for debugging
              this.logger.warn(`   Statement: ${statement.substring(0, 100)}...`);
            }
          }
        }
        
          this.logger.log(`✅ Executed ${executedCount} statements, ${errorCount} errors`);
        } catch (err: any) {
          this.logger.error(`❌ Error processing seed SQL: ${err.message}`);
          throw err;
        }
      }

      // Verify data was loaded
      const customerCount = await this.dataSource.query('SELECT COUNT(*) as count FROM customers');
      const accountCount = await this.dataSource.query('SELECT COUNT(*) as count FROM accounts');
      
      this.logger.log(`📊 Verification: ${customerCount[0]?.count || 0} customers, ${accountCount[0]?.count || 0} accounts`);

      return {
        success: true,
        message: 'Database setup completed successfully',
        details: {
          statementsExecuted: executedCount,
          errors: errorCount,
          customers: String(customerCount[0]?.count || 0),
          accounts: String(accountCount[0]?.count || 0),
          errorMessages: errors.slice(0, 5), // First 5 errors
        },
      };
    } catch (error: any) {
      this.logger.error('Database setup failed:', error);
      throw error;
    }
  }

  @Post('clear-and-import')
  async clearAndImport(@Body() body: { sqlData: string }) {
    try {
      this.logger.log('Starting database clear and import...');

      if (!body.sqlData) {
        throw new Error('sqlData is required in request body');
      }

      // Get all tables in dependency order (child tables first)
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

      // Ensure expected columns exist (handle schema drift)
      await this.dataSource.query(
        `ALTER TABLE public.machinery ADD COLUMN IF NOT EXISTS latitude double precision`,
      );
      await this.dataSource.query(
        `ALTER TABLE public.machinery ADD COLUMN IF NOT EXISTS longitude double precision`,
      );

      // Disable foreign key checks temporarily
      await this.dataSource.query('SET session_replication_role = replica;');

      // Clear all tables
      this.logger.log('Clearing all tables...');
      for (const table of tables) {
        try {
          await this.dataSource.query(`TRUNCATE TABLE public.${table} CASCADE;`);
          this.logger.log(`✅ Cleared ${table}`);
        } catch (err: any) {
          // Table might not exist, skip
          if (!err.message?.includes('does not exist')) {
            this.logger.warn(`⚠️  Could not clear ${table}: ${err.message}`);
          }
        }
      }

      this.logger.log('✅ All tables cleared');

      // Parse and execute the SQL data
      const sqlData = body.sqlData;
      const statements: string[] = [];
      let currentStatement = '';
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let parenDepth = 0;

      for (let i = 0; i < sqlData.length; i++) {
        const char = sqlData[i];
        const prevChar = i > 0 ? sqlData[i - 1] : '';

        if (char === "'" && prevChar !== '\\') {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && prevChar !== '\\') {
          inDoubleQuote = !inDoubleQuote;
        } else if (!inSingleQuote && !inDoubleQuote) {
          if (char === '(') {
            parenDepth++;
          } else if (char === ')') {
            parenDepth--;
          } else if (char === ';' && parenDepth === 0) {
            const stmt = currentStatement.trim();
            if (stmt && !stmt.toLowerCase().startsWith('set ')) {
              statements.push(stmt);
            }
            currentStatement = '';
            continue;
          }
        }

        currentStatement += char;
      }

      const lastStmt = currentStatement.trim();
      if (lastStmt && !lastStmt.toLowerCase().startsWith('set ')) {
        statements.push(lastStmt);
      }

      this.logger.log(`Found ${statements.length} SQL statements to execute`);

      let executedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        try {
          await this.dataSource.query(statement);
          executedCount++;
        } catch (err: any) {
          errorCount++;
          const errorMsg = `Statement ${i + 1}: ${err.message?.substring(0, 150)}`;
          errors.push(errorMsg);
          this.logger.warn(`⚠️  ${errorMsg}`);
        }
      }

      this.logger.log(`✅ Executed ${executedCount} statements, ${errorCount} errors`);

      // Re-enable foreign key checks
      await this.dataSource.query('SET session_replication_role = DEFAULT;');

      // Verify data was loaded
      const customerCount = await this.dataSource.query('SELECT COUNT(*) as count FROM customers');
      const accountCount = await this.dataSource.query('SELECT COUNT(*) as count FROM accounts');

      this.logger.log(`📊 Verification: ${customerCount[0]?.count || 0} customers, ${accountCount[0]?.count || 0} accounts`);

      return {
        success: true,
        message: 'Database cleared and data imported successfully',
        details: {
          statementsExecuted: executedCount,
          errors: errorCount,
          customers: String(customerCount[0]?.count || 0),
          accounts: String(accountCount[0]?.count || 0),
          errorMessages: errors.slice(0, 10),
        },
      };
    } catch (error: any) {
      this.logger.error('Clear and import failed:', error);
      throw error;
    }
  }

  @Post('migrate-remove-outsource-invoice-columns')
  async migrateRemoveOutsourceInvoiceColumns() {
    try {
      this.logger.log('Starting migration: Remove columns from outsource_invoice_lines table...');
      
      const columnsToRemove = [
        'customer_name',
        'machine_code',
        'working_site_name',
        'start_date',
        'end_date',
      ];

      const results = {
        columnsRemoved: [] as string[],
        columnsSkipped: [] as string[],
        errors: [] as string[],
      };

      for (const column of columnsToRemove) {
        try {
          // Check if column exists before dropping
          const columnExists = await this.dataSource.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'outsource_invoice_lines' 
              AND column_name = $1
          `, [column]);

          if (columnExists.length > 0) {
            await this.dataSource.query(`
              ALTER TABLE public.outsource_invoice_lines 
              DROP COLUMN IF EXISTS ${column}
            `);
            results.columnsRemoved.push(column);
            this.logger.log(`   ✅ Removed column: ${column}`);
          } else {
            results.columnsSkipped.push(column);
            this.logger.log(`   ⏭️  Column ${column} does not exist, skipping`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`${column}: ${errorMsg}`);
          this.logger.error(`   ❌ Error removing column ${column}:`, errorMsg);
        }
      }

      return {
        success: results.errors.length === 0,
        message: 'Migration completed',
        details: {
          columnsRemoved: results.columnsRemoved,
          columnsSkipped: results.columnsSkipped,
          errors: results.errors,
        },
      };
    } catch (error) {
      this.logger.error('Error during migration:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Post('migrate-date-to-timestamp')
  async migrateDateToTimestamp() {
    this.logger.log('Starting migration to change date columns to timestamp...');
    try {
      // Change internal_operations date columns to timestamp
      await this.dataSource.query(`
        ALTER TABLE public.internal_operations
        ALTER COLUMN start_date TYPE timestamp with time zone USING start_date::timestamp with time zone,
        ALTER COLUMN end_date TYPE timestamp with time zone USING end_date::timestamp with time zone;
      `);
      this.logger.log('✅ Successfully updated internal_operations date columns.');

      // Change outsource_operations date columns to timestamp
      await this.dataSource.query(`
        ALTER TABLE public.outsource_operations
        ALTER COLUMN start_date TYPE timestamp with time zone USING start_date::timestamp with time zone,
        ALTER COLUMN end_date TYPE timestamp with time zone USING end_date::timestamp with time zone;
      `);
      this.logger.log('✅ Successfully updated outsource_operations date columns.');

      // Change transportation_operations date column to timestamp
      await this.dataSource.query(`
        ALTER TABLE public.transportation_operations
        ALTER COLUMN date TYPE timestamp with time zone USING date::timestamp with time zone;
      `);
      this.logger.log('✅ Successfully updated transportation_operations date column.');

      return { 
        success: true, 
        message: 'Date columns migrated to timestamp successfully. Time will now be preserved.' 
      };
    } catch (error) {
      this.logger.error('❌ Error during migration to change date to timestamp:', error);
      throw error;
    }
  }

  @Post('migrate-add-binary-storage-to-operations-details')
  async migrateAddBinaryStorageToOperationsDetails() {
    this.logger.log('Starting migration: Add binary storage columns to operations_details table...');
    try {
      // Add binary storage columns if they don't exist
      await this.dataSource.query(`
        ALTER TABLE public.operations_details 
        ADD COLUMN IF NOT EXISTS pricing_proposal_pdf BYTEA,
        ADD COLUMN IF NOT EXISTS invoice_pdf BYTEA,
        ADD COLUMN IF NOT EXISTS image_delivery_bundle JSONB,
        ADD COLUMN IF NOT EXISTS image_pickup_bundle JSONB;
      `);
      this.logger.log('✅ Successfully added binary storage columns to operations_details table.');

      return { 
        success: true, 
        message: 'Binary storage columns added to operations_details table successfully.' 
      };
    } catch (error) {
      this.logger.error('❌ Error during migration to add binary storage columns:', error);
      throw error;
    }
  }
}

