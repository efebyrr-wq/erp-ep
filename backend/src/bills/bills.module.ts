import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill, Customer } from '../entities';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Customer])],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}


