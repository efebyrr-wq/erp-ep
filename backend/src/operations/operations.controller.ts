import { Body, Controller, Delete, Get, Patch, Param, Post } from '@nestjs/common';
import {
  InternalOperation,
  OutsourceOperation,
  ServiceOperation,
  TransportationOperation,
} from '../entities';
import { OperationsService } from './operations.service';
import { CreateTransportationOperationDto } from './dto/create-transportation-operation.dto';
import { CreateInternalOperationDto } from './dto/create-internal-operation.dto';
import { CreateOutsourceOperationDto } from './dto/create-outsource-operation.dto';
import { CreateServiceOperationDto } from './dto/create-service-operation.dto';

@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Delete('internal/:id')
  async removeInternal(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.operationsService.removeInternal(id);
      return { message: 'Internal operation deleted successfully' };
    } catch (error) {
      console.error('Error deleting internal operation:', error);
      throw error;
    }
  }

  @Delete('outsource/:id')
  async removeOutsource(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.operationsService.removeOutsource(id);
      return { message: 'Outsource operation deleted successfully' };
    } catch (error) {
      console.error('Error deleting outsource operation:', error);
      throw error;
    }
  }

  @Delete('service/:id')
  async removeService(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.operationsService.removeService(id);
      return { message: 'Service operation deleted successfully' };
    } catch (error) {
      console.error('Error deleting service operation:', error);
      throw error;
    }
  }

  @Delete('transportation/:id')
  async removeTransportation(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.operationsService.removeTransportation(id);
      return { message: 'Transportation operation deleted successfully' };
    } catch (error) {
      console.error('Error deleting transportation operation:', error);
      throw error;
    }
  }

  @Get('internal')
  async findAllInternal(): Promise<InternalOperation[]> {
    return this.operationsService.findAllInternal();
  }

  @Get('internal/active')
  async findActiveInternal(): Promise<InternalOperation[]> {
    return this.operationsService.findActiveInternal();
  }

  @Get('outsource')
  async findAllOutsource(): Promise<OutsourceOperation[]> {
    return this.operationsService.findAllOutsource();
  }

  @Get('outsource/active')
  async findActiveOutsource(): Promise<OutsourceOperation[]> {
    return this.operationsService.findActiveOutsource();
  }

  @Get('service')
  async findAllService(): Promise<ServiceOperation[]> {
    return this.operationsService.findAllService();
  }

  @Get('transportation')
  async findAllTransportation(): Promise<TransportationOperation[]> {
    return this.operationsService.findAllTransportation();
  }

  @Post('internal')
  async createInternal(
    @Body() createInternalDto: CreateInternalOperationDto,
  ): Promise<InternalOperation> {
    try {
      return await this.operationsService.createInternal(createInternalDto);
    } catch (error) {
      console.error('Error creating internal operation:', error);
      throw error;
    }
  }

  @Post('outsource')
  async createOutsource(
    @Body() createOutsourceDto: CreateOutsourceOperationDto,
  ): Promise<OutsourceOperation> {
    try {
      return await this.operationsService.createOutsource(createOutsourceDto);
    } catch (error) {
      console.error('Error creating outsource operation:', error);
      throw error;
    }
  }

  @Post('service')
  async createService(
    @Body() createServiceDto: CreateServiceOperationDto,
  ): Promise<ServiceOperation> {
    return this.operationsService.createService(createServiceDto);
  }

  @Post('transportation')
  async createTransportation(
    @Body() createTransportationDto: CreateTransportationOperationDto,
  ): Promise<TransportationOperation> {
    return this.operationsService.createTransportation(createTransportationDto);
  }

  @Patch('internal/:id/close')
  async closeInternalOperation(@Param('id') id: string): Promise<InternalOperation> {
    return this.operationsService.closeInternalOperation(id);
  }

  @Patch('outsource/:id/close')
  async closeOutsourceOperation(@Param('id') id: string): Promise<OutsourceOperation> {
    return this.operationsService.closeOutsourceOperation(id);
  }

  @Patch('sync-machinery-locations')
  async syncMachineryLocations(): Promise<{ message: string; updated: number }> {
    return this.operationsService.syncMachineryLocations();
  }

  @Patch('internal/:id')
  async updateInternal(
    @Param('id') id: string,
    @Body() updateDto: CreateInternalOperationDto,
  ): Promise<InternalOperation> {
    try {
      return await this.operationsService.updateInternal(id, updateDto);
    } catch (error) {
      console.error('Error updating internal operation:', error);
      throw error;
    }
  }

  @Patch('outsource/:id')
  async updateOutsource(
    @Param('id') id: string,
    @Body() updateDto: CreateOutsourceOperationDto,
  ): Promise<OutsourceOperation> {
    try {
      return await this.operationsService.updateOutsource(id, updateDto);
    } catch (error) {
      console.error('Error updating outsource operation:', error);
      throw error;
    }
  }

  @Patch('service/:id')
  async updateService(
    @Param('id') id: string,
    @Body() updateDto: CreateServiceOperationDto,
  ): Promise<ServiceOperation> {
    try {
      return await this.operationsService.updateService(id, updateDto);
    } catch (error) {
      console.error('Error updating service operation:', error);
      throw error;
    }
  }

  @Patch('transportation/:id')
  async updateTransportation(
    @Param('id') id: string,
    @Body() updateDto: CreateTransportationOperationDto,
  ): Promise<TransportationOperation> {
    try {
      return await this.operationsService.updateTransportation(id, updateDto);
    } catch (error) {
      console.error('Error updating transportation operation:', error);
      throw error;
    }
  }
}

