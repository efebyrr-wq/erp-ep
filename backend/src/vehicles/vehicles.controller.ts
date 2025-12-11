import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Vehicle } from '../entities';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }
}





