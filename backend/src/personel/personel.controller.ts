import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Personel, PersonelPayment, PersonelDetail } from '../entities';
import { PersonelService } from './personel.service';
import { CreatePersonelDto } from './dto/create-personel.dto';
import { UpdatePersonelDto } from './dto/update-personel.dto';
import { CreatePersonelPaymentDto } from './dto/create-personel-payment.dto';
import { UpdatePersonelPaymentDto } from './dto/update-personel-payment.dto';
import { CreatePersonelDetailDto } from './dto/create-personel-detail.dto';
import { UpdatePersonelDetailDto } from './dto/update-personel-detail.dto';

@Controller('personel')
export class PersonelController {
  constructor(private readonly personelService: PersonelService) {}

  @Get()
  async findAll(): Promise<Personel[]> {
    return this.personelService.findAll();
  }

  @Post()
  async create(@Body() dto: CreatePersonelDto): Promise<Personel> {
    return this.personelService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePersonelDto): Promise<Personel> {
    return this.personelService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.personelService.remove(id);
    return { message: 'Personel deleted successfully' };
  }

  // Personel Payment endpoints
  @Get('payments')
  async findAllPayments(): Promise<PersonelPayment[]> {
    return this.personelService.findAllPayments();
  }

  @Post('payments')
  async createPayment(@Body() dto: CreatePersonelPaymentDto): Promise<PersonelPayment> {
    return this.personelService.createPayment(dto);
  }

  @Patch('payments/:id')
  async updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePersonelPaymentDto,
  ): Promise<PersonelPayment> {
    return this.personelService.updatePayment(id, dto);
  }

  @Delete('payments/:id')
  async removePayment(@Param('id') id: string): Promise<{ message: string }> {
    await this.personelService.removePayment(id);
    return { message: 'Personel payment deleted successfully' };
  }

  // Personel Detail endpoints
  @Post('details')
  async createDetail(@Body() createDetailDto: CreatePersonelDetailDto): Promise<PersonelDetail> {
    const { personelId, ...detailData } = createDetailDto;
    return this.personelService.createDetail(personelId, detailData);
  }

  @Patch('details/:detailId')
  async updateDetail(
    @Param('detailId') detailId: string,
    @Body() updateDetailDto: UpdatePersonelDetailDto,
  ): Promise<PersonelDetail> {
    return this.personelService.updateDetail(detailId, updateDetailDto);
  }

  @Delete('details/:detailId')
  async removeDetail(@Param('detailId') detailId: string): Promise<{ message: string }> {
    await this.personelService.removeDetail(detailId);
    return { message: 'Personel detail deleted successfully' };
  }
}

