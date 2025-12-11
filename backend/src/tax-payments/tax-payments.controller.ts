import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TaxPayment } from '../entities';
import { TaxPaymentsService } from './tax-payments.service';
import { CreateTaxPaymentDto } from './dto/create-tax-payment.dto';
import { UpdateTaxPaymentDto } from './dto/update-tax-payment.dto';

@Controller('tax-payments')
export class TaxPaymentsController {
  constructor(private readonly taxPaymentsService: TaxPaymentsService) {}

  @Get()
  async findAll(@Query('taxType') taxType?: string): Promise<TaxPayment[]> {
    if (taxType) {
      return this.taxPaymentsService.findByTaxType(taxType);
    }
    return this.taxPaymentsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateTaxPaymentDto): Promise<TaxPayment> {
    return this.taxPaymentsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxPaymentDto,
  ): Promise<TaxPayment> {
    return this.taxPaymentsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.taxPaymentsService.remove(id);
    return { message: 'Tax payment deleted successfully' };
  }
}






