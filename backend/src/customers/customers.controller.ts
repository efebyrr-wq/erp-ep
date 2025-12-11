import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from '../entities';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>): Promise<Customer> {
    return this.customersService.update(id, dto);
  }
}














