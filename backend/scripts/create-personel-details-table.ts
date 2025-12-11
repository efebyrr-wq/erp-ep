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

    // Check if table exists
    const tableExists = await queryRunner.hasTable('personel_details');
    if (!tableExists) {
      // Create table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE public.personel_details (
          id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          personel_id bigint NOT NULL REFERENCES public.personel (personel_id) ON DELETE CASCADE,
          detail_name text NOT NULL,
          detail_value text NOT NULL,
          created_at timestamptz DEFAULT now()
        );
      `);
      logger.log('✅ Created personel_details table');
    } else {
      logger.log('ℹ️ personel_details table already exists.');
    }

    // Create index if it doesn't exist
    try {
      const indexCheck = await queryRunner.query(`
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'personel_details' 
        AND indexname = 'idx_personel_details_personel_id';
      `);
      if (indexCheck.length === 0) {
        await queryRunner.query(`
          CREATE INDEX idx_personel_details_personel_id ON public.personel_details (personel_id);
        `);
        logger.log('✅ Created index idx_personel_details_personel_id');
      } else {
        logger.log('ℹ️ Index idx_personel_details_personel_id already exists.');
      }
    } catch (error) {
      logger.warn('Could not check/create index:', error);
    }

    await queryRunner.release();
    await app.close();
    logger.log('✅ Successfully set up personel_details table!');
  } catch (error) {
    logger.error('❌ Failed to set up personel_details table:', error);
    process.exit(1);
  }
}

bootstrap();

