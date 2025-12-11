import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CollectionsCheck,
  CollectionCreditCard,
  CollectionCash,
  Customer,
  Account,
  Supplier,
  Outsourcer,
} from '../entities';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CollectionsCheck,
      CollectionCreditCard,
      CollectionCash,
      Customer,
      Account,
      Supplier,
      Outsourcer,
    ]),
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}






