import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxPayment, Account } from '../entities';
import { TaxPaymentsController } from './tax-payments.controller';
import { TaxPaymentsService } from './tax-payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxPayment, Account])],
  controllers: [TaxPaymentsController],
  providers: [TaxPaymentsService],
})
export class TaxPaymentsModule {}









