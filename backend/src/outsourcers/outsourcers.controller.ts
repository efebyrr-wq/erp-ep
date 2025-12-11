import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Outsourcer } from '../entities';
import { CreateOutsourcerDto } from './dto/create-outsourcer.dto';
import { OutsourcersService } from './outsourcers.service';

@Controller('outsourcers')
export class OutsourcersController {
  constructor(private readonly outsourcersService: OutsourcersService) {}

  @Get()
  async findAll(): Promise<Outsourcer[]> {
    return this.outsourcersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateOutsourcerDto): Promise<Outsourcer> {
    return this.outsourcersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateOutsourcerDto,
  ): Promise<Outsourcer> {
    return this.outsourcersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.outsourcersService.remove(id);
  }
}











