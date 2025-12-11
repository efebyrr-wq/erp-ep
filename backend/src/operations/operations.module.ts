import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InternalOperation,
  OutsourceOperation,
  ServiceOperation,
  TransportationOperation,
  WorkingSite,
  OperationDetails,
} from '../entities';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { OperationDetailsController } from './operation-details.controller';
import { OperationDetailsService } from './operation-details.service';
import { MachineryModule } from '../machinery/machinery.module';
import { GeocodingService } from '../common/geocoding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InternalOperation,
      OutsourceOperation,
      ServiceOperation,
      TransportationOperation,
      WorkingSite,
      OperationDetails,
    ]),
    MachineryModule,
  ],
  controllers: [OperationsController, OperationDetailsController],
  providers: [OperationsService, OperationDetailsService, GeocodingService],
})
export class OperationsModule {}






