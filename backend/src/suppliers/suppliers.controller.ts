import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Supplier, Supply } from '../entities';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SuppliersService } from './suppliers.service';
import { CreateSupplyDto } from './dto/create-supply.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(): Promise<Supplier[]> {
    return this.suppliersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.suppliersService.remove(id);
  }

  @Post(':id/supplies')
  async createSupply(
    @Param('id') supplierId: string,
    @Body() dto: CreateSupplyDto,
  ): Promise<Supply> {
    return this.suppliersService.createSupply(supplierId, dto);
  }
}






