import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CollectionsCheck,
  CollectionCreditCard,
  CollectionCash,
} from '../entities';
import { CollectionsService } from './collections.service';
import { CreateCollectionCheckDto } from './dto/create-collection-check.dto';
import { UpdateCollectionCheckDto } from './dto/update-collection-check.dto';
import { CreateCollectionCreditCardDto } from './dto/create-collection-credit-card.dto';
import { UpdateCollectionCreditCardDto } from './dto/update-collection-credit-card.dto';
import { CreateCollectionCashDto } from './dto/create-collection-cash.dto';
import { UpdateCollectionCashDto } from './dto/update-collection-cash.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('check')
  async findAllCheck(): Promise<CollectionsCheck[]> {
    return this.collectionsService.findAllCheck();
  }

  @Post('check')
  async createCheck(@Body() dto: CreateCollectionCheckDto): Promise<CollectionsCheck> {
    return this.collectionsService.createCheck(dto);
  }

  @Patch('check/:id')
  async updateCheck(@Param('id') id: string, @Body() dto: UpdateCollectionCheckDto): Promise<CollectionsCheck> {
    return this.collectionsService.updateCheck(id, dto);
  }

  @Delete('check/:id')
  async removeCheck(@Param('id') id: string): Promise<{ message: string }> {
    await this.collectionsService.removeCheck(id);
    return { message: 'Collection check deleted successfully' };
  }

  @Get('credit-card')
  async findAllCreditCard(): Promise<CollectionCreditCard[]> {
    return this.collectionsService.findAllCreditCard();
  }

  @Post('credit-card')
  async createCreditCard(@Body() dto: CreateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    return this.collectionsService.createCreditCard(dto);
  }

  @Patch('credit-card/:id')
  async updateCreditCard(@Param('id') id: string, @Body() dto: UpdateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    return this.collectionsService.updateCreditCard(id, dto);
  }

  @Delete('credit-card/:id')
  async removeCreditCard(@Param('id') id: string): Promise<{ message: string }> {
    await this.collectionsService.removeCreditCard(id);
    return { message: 'Collection credit card deleted successfully' };
  }

  @Get('cash')
  async findAllCash(): Promise<CollectionCash[]> {
    return this.collectionsService.findAllCash();
  }

  @Post('cash')
  async createCash(@Body() dto: CreateCollectionCashDto): Promise<CollectionCash> {
    return this.collectionsService.createCash(dto);
  }

  @Patch('cash/:id')
  async updateCash(@Param('id') id: string, @Body() dto: UpdateCollectionCashDto): Promise<CollectionCash> {
    return this.collectionsService.updateCash(id, dto);
  }

  @Delete('cash/:id')
  async removeCash(@Param('id') id: string): Promise<{ message: string }> {
    await this.collectionsService.removeCash(id);
    return { message: 'Collection cash deleted successfully' };
  }
}


