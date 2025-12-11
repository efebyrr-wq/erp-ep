import { Module } from '@nestjs/common';
import { DatabaseSetupController } from './database-setup.controller';

@Module({
  controllers: [DatabaseSetupController],
})
export class DatabaseSetupModule {}


