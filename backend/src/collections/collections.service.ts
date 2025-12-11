import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CollectionsCheck,
  CollectionCreditCard,
  CollectionCash,
} from '../entities';
import { CreateCollectionCheckDto } from './dto/create-collection-check.dto';
import { UpdateCollectionCheckDto } from './dto/update-collection-check.dto';
import { CreateCollectionCreditCardDto } from './dto/create-collection-credit-card.dto';
import { UpdateCollectionCreditCardDto } from './dto/update-collection-credit-card.dto';
import { CreateCollectionCashDto } from './dto/create-collection-cash.dto';
import { UpdateCollectionCashDto } from './dto/update-collection-cash.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionsCheck)
    private readonly collectionsCheckRepository: Repository<CollectionsCheck>,
    @InjectRepository(CollectionCreditCard)
    private readonly collectionCreditCardRepository: Repository<CollectionCreditCard>,
    @InjectRepository(CollectionCash)
    private readonly collectionCashRepository: Repository<CollectionCash>,
  ) {}

  async findAllCheck(): Promise<CollectionsCheck[]> {
    return this.collectionsCheckRepository.find({
      order: {
        collectionDate: 'DESC',
      },
    });
  }

  async createCheck(dto: CreateCollectionCheckDto): Promise<CollectionsCheck> {
    const collection = this.collectionsCheckRepository.create({
      customerName: dto.customerName,
      checkDate: dto.checkDate,
      amount: dto.amount,
      collectionDate: dto.collectionDate,
      accountName: dto.accountName,
      notes: dto.notes ?? null,
    });
    return this.collectionsCheckRepository.save(collection);
  }

  async updateCheck(id: string, dto: UpdateCollectionCheckDto): Promise<CollectionsCheck> {
    const collection = await this.collectionsCheckRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection check with ID ${id} not found`);
    }

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.checkDate !== undefined) collection.checkDate = dto.checkDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.collectionDate !== undefined) collection.collectionDate = dto.collectionDate;
    if (dto.accountName !== undefined) collection.accountName = dto.accountName;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    return this.collectionsCheckRepository.save(collection);
  }

  async removeCheck(id: string): Promise<void> {
    const collection = await this.collectionsCheckRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection check with ID ${id} not found`);
    }

    await this.collectionsCheckRepository.remove(collection);
  }

  async findAllCreditCard(): Promise<CollectionCreditCard[]> {
    return this.collectionCreditCardRepository.find({
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async createCreditCard(dto: CreateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    const collection = this.collectionCreditCardRepository.create({
      customerName: dto.customerName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      paymentTo: dto.paymentTo,
      creditCardFee: dto.creditCardFee ?? null,
      notes: dto.notes ?? null,
    });
    return this.collectionCreditCardRepository.save(collection);
  }

  async updateCreditCard(id: string, dto: UpdateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    const collection = await this.collectionCreditCardRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection credit card with ID ${id} not found`);
    }

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.transactionDate !== undefined) collection.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.paymentTo !== undefined) collection.paymentTo = dto.paymentTo;
    if (dto.creditCardFee !== undefined) collection.creditCardFee = dto.creditCardFee;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    return this.collectionCreditCardRepository.save(collection);
  }

  async removeCreditCard(id: string): Promise<void> {
    const collection = await this.collectionCreditCardRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection credit card with ID ${id} not found`);
    }

    await this.collectionCreditCardRepository.remove(collection);
  }

  async findAllCash(): Promise<CollectionCash[]> {
    return this.collectionCashRepository.find({
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async createCash(dto: CreateCollectionCashDto): Promise<CollectionCash> {
    const collection = this.collectionCashRepository.create({
      customerName: dto.customerName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      accountName: dto.accountName,
      notes: dto.notes ?? null,
    });
    return this.collectionCashRepository.save(collection);
  }

  async updateCash(id: string, dto: UpdateCollectionCashDto): Promise<CollectionCash> {
    const collection = await this.collectionCashRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection cash with ID ${id} not found`);
    }

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.transactionDate !== undefined) collection.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.accountName !== undefined) collection.accountName = dto.accountName;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    return this.collectionCashRepository.save(collection);
  }

  async removeCash(id: string): Promise<void> {
    const collection = await this.collectionCashRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection cash with ID ${id} not found`);
    }

    await this.collectionCashRepository.remove(collection);
  }
}


