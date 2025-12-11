import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('DatabaseMigration');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    logger.log('✅ Connected to database');

    const queryRunner = dataSource.createQueryRunner();

    const tableExists = await queryRunner.hasTable('tax_payments');
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE public.tax_payments (
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
      logger.log('✅ Created tax_payments table');
    } else {
      logger.log('ℹ️ tax_payments table already exists.');
    }

    // Create indexes if they don't exist
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
      `);
      logger.log('✅ Created index idx_tax_payments_tax_type');
    } catch (error: any) {
      if (error.code !== '42P07') { // Index already exists
        logger.log('ℹ️ Index idx_tax_payments_tax_type already exists or error occurred.');
      }
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);
      `);
      logger.log('✅ Created index idx_tax_payments_payment_date');
    } catch (error: any) {
      if (error.code !== '42P07') { // Index already exists
        logger.log('ℹ️ Index idx_tax_payments_payment_date already exists or error occurred.');
      }
    }

    await queryRunner.release();
    await app.close();
    logger.log('✅ Successfully set up tax_payments table!');
  } catch (error) {
    logger.error('❌ Failed to set up tax_payments table:', error);
    process.exit(1);
  }
}

bootstrap();

