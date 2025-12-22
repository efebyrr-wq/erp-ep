import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Machinery, MachinerySpec } from '../entities';
import { MachineryService } from './machinery.service';
import { CreateMachineryDto, UpdateMachineryDto, CreateMachinerySpecDto, UpdateMachinerySpecDto } from './dto';
import { CreateMachinerySpecWithIdDto } from './dto/create-machinery-spec-with-id.dto';

@Controller('machinery')
export class MachineryController {
  constructor(private readonly machineryService: MachineryService) {}

  @Get()
  async findAll(): Promise<Machinery[]> {
    return this.machineryService.findAll();
  }

  // Specs routes - must come before generic @Post() to avoid route conflicts
  @Post('specs')
  async createSpec(
    @Body() createSpecDto: CreateMachinerySpecWithIdDto,
  ): Promise<MachinerySpec> {
    const { machineryId, ...specData } = createSpecDto;
    return this.machineryService.createSpec(machineryId, specData);
  }

  @Post()
  async create(@Body() createMachineryDto: CreateMachineryDto): Promise<Machinery> {
    return this.machineryService.create(createMachineryDto);
  }

  @Patch('specs/:specId')
  async updateSpec(
    @Param('specId') specId: string,
    @Body() updateSpecDto: UpdateMachinerySpecDto,
  ): Promise<MachinerySpec> {
    return this.machineryService.updateSpec(specId, updateSpecDto);
  }

  @Delete('specs/:specId')
  async removeSpec(@Param('specId') specId: string): Promise<void> {
    return this.machineryService.removeSpec(specId);
  }

  // Specific routes must come before generic :id routes
  @Patch(':machineNumber/coordinates')
  async updateCoordinates(
    @Param('machineNumber') machineNumber: string,
    @Body() body: { latitude: string; longitude: string; status?: string },
  ): Promise<{ message: string }> {
    // Get current status if not provided
    let status: string | null = body.status || null;
    if (status === null) {
      const allMachinery = await this.machineryService.findAll();
      const machinery = allMachinery.find(m => m.machineNumber === machineNumber);
      status = machinery?.status || null;
    }
    
    await this.machineryService.updateMachineryStatusAndLocation(
      machineNumber,
      status,
      body.latitude,
      body.longitude,
    );
    return { message: `Updated coordinates for ${machineNumber}` };
  }

  @Patch(':machineNumber/status')
  async updateStatus(
    @Param('machineNumber') machineNumber: string,
    @Body() body: { status: string; latitude?: string; longitude?: string },
  ): Promise<{ message: string; machinery: Machinery | null }> {
    const machinery = await this.machineryService.updateMachineryStatusAndLocation(
      machineNumber,
      body.status || null,
      body.latitude || null,
      body.longitude || null,
    );
    return { 
      message: `Updated status for ${machineNumber} to ${body.status || 'null'}`,
      machinery 
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMachineryDto: UpdateMachineryDto,
  ): Promise<Machinery> {
    return this.machineryService.update(id, updateMachineryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.machineryService.remove(id);
  }
}




