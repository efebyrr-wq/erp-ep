import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OperationDetails } from '../entities/operation-details.entity';
import { OperationDetailsService } from './operation-details.service';
import { CreateOperationDetailsDto } from './dto/create-operation-details.dto';
import { UpdateOperationDetailsDto } from './dto/update-operation-details.dto';

// Helper function to transform Buffer to base64 for JSON response
function transformOperationDetails(details: OperationDetails | null): any {
  if (!details) {
    return null;
  }

  try {
    return {
      ...details,
      pricingProposalPdf: details.pricingProposalPdf 
        ? (Buffer.isBuffer(details.pricingProposalPdf) 
            ? details.pricingProposalPdf.toString('base64') 
            : details.pricingProposalPdf)
        : null,
      invoicePdf: details.invoicePdf 
        ? (Buffer.isBuffer(details.invoicePdf) 
            ? details.invoicePdf.toString('base64') 
            : details.invoicePdf)
        : null,
      // Image bundles are already in JSON format, no conversion needed
    };
  } catch (error) {
    console.error('Error transforming operation details:', error);
    // Return basic structure even if transformation fails
    return {
      operationId: details.operationId,
      operationType: details.operationType,
      deliveryTransportation: details.deliveryTransportation,
      pickupTransportation: details.pickupTransportation,
      pricingProposalPdf: null,
      invoicePdf: null,
      imageDeliveryBundle: details.imageDeliveryBundle,
      imagePickupBundle: details.imagePickupBundle,
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
    };
  }
}

@Controller('operation-details')
export class OperationDetailsController {
  constructor(
    private readonly operationDetailsService: OperationDetailsService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateOperationDetailsDto,
  ): Promise<any> {
    try {
      const details = await this.operationDetailsService.create(dto);
      return transformOperationDetails(details);
    } catch (error) {
      console.error('Error in create operation details controller:', error);
      throw error;
    }
  }

  @Get(':operationId')
  async findOne(
    @Param('operationId') operationId: string,
  ): Promise<any> {
    const details = await this.operationDetailsService.findOne(operationId);
    return transformOperationDetails(details);
  }

  @Get()
  async findByOperationType(
    @Query('operationType') operationType?: string,
  ): Promise<any[]> {
    if (operationType) {
      const details = await this.operationDetailsService.findByOperationType(operationType);
      return details.map(transformOperationDetails);
    }
    // If no operationType provided, return all (or implement findAll if needed)
    return [];
  }

  @Patch(':operationId')
  async update(
    @Param('operationId') operationId: string,
    @Body() dto: UpdateOperationDetailsDto,
  ): Promise<any> {
    try {
      const details = await this.operationDetailsService.update(operationId, dto);
      return transformOperationDetails(details);
    } catch (error) {
      console.error('Error in update operation details controller:', error);
      throw error;
    }
  }

  @Delete(':operationId')
  async remove(@Param('operationId') operationId: string): Promise<void> {
    return this.operationDetailsService.remove(operationId);
  }
}



