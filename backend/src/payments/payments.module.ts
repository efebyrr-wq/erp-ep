import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PaymentsCheck,
  PaymentCreditCard,
  PaymentsCash,
  Customer,
  Account,
  Supplier,
} from '../entities';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentsCheck,
      PaymentCreditCard,
      PaymentsCash,
      Customer,
      Account,
      Supplier,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

