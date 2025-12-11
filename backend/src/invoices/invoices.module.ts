import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceLine, Supplier, OutsourceInvoiceLine, Outsourcer, OutsourceOperation } from '../entities';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceLine, Supplier, OutsourceInvoiceLine, Outsourcer, OutsourceOperation])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}


