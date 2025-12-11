import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machinery, MachinerySpec } from '../entities';
import { MachineryController } from './machinery.controller';
import { MachineryService } from './machinery.service';

@Module({
  imports: [TypeOrmModule.forFeature([Machinery, MachinerySpec])],
  controllers: [MachineryController],
  providers: [MachineryService],
  exports: [MachineryService],
})
export class MachineryModule {}




