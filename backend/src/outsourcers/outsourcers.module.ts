import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Outsourcer,
  OutsourcerContactPerson,
} from '../entities';
import { OutsourcersController } from './outsourcers.controller';
import { OutsourcersService } from './outsourcers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Outsourcer, OutsourcerContactPerson])],
  controllers: [OutsourcersController],
  providers: [OutsourcersService],
  exports: [OutsourcersService],
})
export class OutsourcersModule {}














