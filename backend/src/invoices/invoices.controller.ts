import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Invoice } from '../entities';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(): Promise<Invoice[]> {
    return this.invoicesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoicesService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto): Promise<Invoice> {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.invoicesService.remove(id);
    return { message: 'Invoice deleted successfully' };
  }
}


