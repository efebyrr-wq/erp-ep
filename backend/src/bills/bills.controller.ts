import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Bill } from '../entities';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';

@Controller('billing')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  async create(@Body() createBillDto: CreateBillDto): Promise<Bill> {
    try {
      return await this.billsService.create(createBillDto);
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  @Get()
  async findAll(): Promise<Bill[]> {
    return this.billsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Bill | null> {
    return this.billsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.billsService.remove(id);
      return { message: 'Bill deleted successfully' };
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }
}


