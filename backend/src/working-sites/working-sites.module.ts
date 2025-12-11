import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkingSite } from '../entities';
import { WorkingSitesController } from './working-sites.controller';
import { WorkingSitesService } from './working-sites.service';
import { GeocodingService } from '../common/geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkingSite])],
  controllers: [WorkingSitesController],
  providers: [WorkingSitesService, GeocodingService],
  exports: [GeocodingService],
})
export class WorkingSitesModule {}







