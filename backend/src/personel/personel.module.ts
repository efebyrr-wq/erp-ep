import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonelController } from './personel.controller';
import { PersonelService } from './personel.service';
import { Personel, PersonelPayment, PersonelDetail } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Personel, PersonelPayment, PersonelDetail])],
  controllers: [PersonelController],
  providers: [PersonelService],
  exports: [PersonelService],
})
export class PersonelModule {}

