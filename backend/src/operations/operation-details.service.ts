import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationDetails } from '../entities/operation-details.entity';
import { CreateOperationDetailsDto } from './dto/create-operation-details.dto';
import { UpdateOperationDetailsDto } from './dto/update-operation-details.dto';

@Injectable()
export class OperationDetailsService {
  constructor(
    @InjectRepository(OperationDetails)
    private readonly operationDetailsRepository: Repository<OperationDetails>,
  ) {}

  async create(dto: CreateOperationDetailsDto): Promise<OperationDetails> {
    try {
      console.log('Creating operation details:', {
        operationId: dto.operationId,
        operationType: dto.operationType,
        hasPricingPdf: !!dto.pricingProposalPdf,
        hasInvoicePdf: !!dto.invoicePdf,
        deliveryImagesCount: dto.imageDeliveryBundle?.length || 0,
        pickupImagesCount: dto.imagePickupBundle?.length || 0,
      });

      const details = this.operationDetailsRepository.create({
        operationId: dto.operationId,
        operationType: dto.operationType,
        deliveryTransportation: dto.deliveryTransportation || null,
        pickupTransportation: dto.pickupTransportation || null,
        // Convert base64 to Buffer for binary storage
        pricingProposalPdf: dto.pricingProposalPdf 
          ? Buffer.from(dto.pricingProposalPdf, 'base64') 
          : null,
        invoicePdf: dto.invoicePdf 
          ? Buffer.from(dto.invoicePdf, 'base64') 
          : null,
        imageDeliveryBundle: dto.imageDeliveryBundle || null,
        imagePickupBundle: dto.imagePickupBundle || null,
      });

      const saved = await this.operationDetailsRepository.save(details);
      console.log('Operation details saved successfully:', saved.operationId);
      return saved;
    } catch (error) {
      console.error('Error creating operation details:', error);
      throw error;
    }
  }

  async findOne(operationId: string): Promise<OperationDetails | null> {
    try {
      console.log('Fetching operation details for:', operationId);
      const details = await this.operationDetailsRepository.findOne({
        where: { operationId },
        relations: ['deliveryTransportationOp', 'pickupTransportationOp'],
      });

      if (!details) {
        console.log('No operation details found for:', operationId);
        return null;
      }

      console.log('Operation details found:', {
        operationId: details.operationId,
        hasPricingPdf: !!details.pricingProposalPdf,
        hasInvoicePdf: !!details.invoicePdf,
        deliveryImagesCount: details.imageDeliveryBundle?.length || 0,
        pickupImagesCount: details.imagePickupBundle?.length || 0,
      });

      return details;
    } catch (error) {
      console.error('Error fetching operation details:', error);
      throw error;
    }
  }

  async findByOperationType(
    operationType: string,
  ): Promise<OperationDetails[]> {
    return this.operationDetailsRepository.find({
      where: { operationType },
      relations: ['deliveryTransportationOp', 'pickupTransportationOp'],
    });
  }

  async update(
    operationId: string,
    dto: UpdateOperationDetailsDto,
  ): Promise<OperationDetails> {
    const details = await this.findOne(operationId);

    if (!details) {
      throw new NotFoundException(
        `Operation details with operation ID ${operationId} not found`,
      );
    }

    // Update only provided fields
    if (dto.deliveryTransportation !== undefined) {
      details.deliveryTransportation = dto.deliveryTransportation || null;
    }
    if (dto.pickupTransportation !== undefined) {
      details.pickupTransportation = dto.pickupTransportation || null;
    }
    if (dto.pricingProposalPdf !== undefined) {
      details.pricingProposalPdf = dto.pricingProposalPdf 
        ? Buffer.from(dto.pricingProposalPdf, 'base64') 
        : null;
    }
    if (dto.invoicePdf !== undefined) {
      details.invoicePdf = dto.invoicePdf 
        ? Buffer.from(dto.invoicePdf, 'base64') 
        : null;
    }
    if (dto.imageDeliveryBundle !== undefined) {
      details.imageDeliveryBundle = dto.imageDeliveryBundle || null;
    }
    if (dto.imagePickupBundle !== undefined) {
      details.imagePickupBundle = dto.imagePickupBundle || null;
    }

    return this.operationDetailsRepository.save(details);
  }

  async remove(operationId: string): Promise<void> {
    const details = await this.findOne(operationId);

    if (!details) {
      throw new NotFoundException(
        `Operation details with operation ID ${operationId} not found`,
      );
    }

    await this.operationDetailsRepository.remove(details);
  }
}



