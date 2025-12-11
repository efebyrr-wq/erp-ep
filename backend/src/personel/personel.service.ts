import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personel, PersonelPayment, PersonelDetail } from '../entities';
import { CreatePersonelDto } from './dto/create-personel.dto';
import { UpdatePersonelDto } from './dto/update-personel.dto';
import { CreatePersonelPaymentDto } from './dto/create-personel-payment.dto';
import { UpdatePersonelPaymentDto } from './dto/update-personel-payment.dto';
import { CreatePersonelDetailDto } from './dto/create-personel-detail.dto';
import { UpdatePersonelDetailDto } from './dto/update-personel-detail.dto';

@Injectable()
export class PersonelService {
  constructor(
    @InjectRepository(Personel)
    private readonly personelRepository: Repository<Personel>,
    @InjectRepository(PersonelPayment)
    private readonly personelPaymentRepository: Repository<PersonelPayment>,
    @InjectRepository(PersonelDetail)
    private readonly personelDetailRepository: Repository<PersonelDetail>,
  ) {}

  async findAll(): Promise<Personel[]> {
    return this.personelRepository.find({
      relations: ['details'],
      order: {
        personelName: 'ASC',
      },
    });
  }

  async create(dto: CreatePersonelDto): Promise<Personel> {
    const personel = this.personelRepository.create({
      personelName: dto.personelName,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      tcKimlik: dto.tcKimlik ?? null,
      birthDate: dto.birthDate ?? null,
      role: dto.role ?? null,
    });
    return this.personelRepository.save(personel);
  }

  async update(id: string, dto: UpdatePersonelDto): Promise<Personel> {
    const personel = await this.personelRepository.findOne({
      where: { id },
    });

    if (!personel) {
      throw new NotFoundException(`Personel with ID ${id} not found`);
    }

    if (dto.personelName !== undefined) {
      personel.personelName = dto.personelName;
    }
    if (dto.startDate !== undefined) {
      personel.startDate = dto.startDate ?? null;
    }
    if (dto.endDate !== undefined) {
      personel.endDate = dto.endDate ?? null;
    }
    if (dto.tcKimlik !== undefined) {
      personel.tcKimlik = dto.tcKimlik ?? null;
    }
    if (dto.birthDate !== undefined) {
      personel.birthDate = dto.birthDate ?? null;
    }
    if (dto.role !== undefined) {
      personel.role = dto.role ?? null;
    }

    return this.personelRepository.save(personel);
  }

  async remove(id: string): Promise<void> {
    const personel = await this.personelRepository.findOne({
      where: { id },
    });

    if (!personel) {
      throw new NotFoundException(`Personel with ID ${id} not found`);
    }

    await this.personelRepository.remove(personel);
  }

  // Personel Payment methods
  async findAllPayments(): Promise<PersonelPayment[]> {
    return this.personelPaymentRepository.find({
      order: {
        date: 'DESC',
      },
    });
  }

  async createPayment(dto: CreatePersonelPaymentDto): Promise<PersonelPayment> {
    const payment = this.personelPaymentRepository.create({
      personelName: dto.personelName,
      paymentAccount: dto.paymentAccount ?? null,
      amount: dto.amount ? String(dto.amount) : null,
      date: dto.date ?? null,
      notes: dto.notes ?? null,
    });
    return this.personelPaymentRepository.save(payment);
  }

  async updatePayment(id: string, dto: UpdatePersonelPaymentDto): Promise<PersonelPayment> {
    const payment = await this.personelPaymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Personel payment with ID ${id} not found`);
    }

    if (dto.personelName !== undefined) {
      payment.personelName = dto.personelName;
    }
    if (dto.paymentAccount !== undefined) {
      payment.paymentAccount = dto.paymentAccount ?? null;
    }
    if (dto.amount !== undefined) {
      payment.amount = dto.amount ? String(dto.amount) : null;
    }
    if (dto.date !== undefined) {
      payment.date = dto.date ?? null;
    }
    if (dto.notes !== undefined) {
      payment.notes = dto.notes ?? null;
    }

    return this.personelPaymentRepository.save(payment);
  }

  async removePayment(id: string): Promise<void> {
    const payment = await this.personelPaymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Personel payment with ID ${id} not found`);
    }

    await this.personelPaymentRepository.remove(payment);
  }

  // Personel Detail methods
  async createDetail(personelId: string, dto: { detailName: string; detailValue: string }): Promise<PersonelDetail> {
    const personel = await this.personelRepository.findOne({ where: { id: personelId } });
    if (!personel) {
      throw new NotFoundException(`Personel with id ${personelId} not found`);
    }

    const detail = this.personelDetailRepository.create({
      personelId,
      detailName: dto.detailName,
      detailValue: dto.detailValue,
    });

    return this.personelDetailRepository.save(detail);
  }

  async updateDetail(detailId: string, dto: UpdatePersonelDetailDto): Promise<PersonelDetail> {
    const detail = await this.personelDetailRepository.findOne({ where: { id: detailId } });
    if (!detail) {
      throw new NotFoundException(`Personel detail with id ${detailId} not found`);
    }

    if (dto.detailName !== undefined) {
      detail.detailName = dto.detailName;
    }
    if (dto.detailValue !== undefined) {
      detail.detailValue = dto.detailValue;
    }

    return this.personelDetailRepository.save(detail);
  }

  async removeDetail(detailId: string): Promise<void> {
    await this.personelDetailRepository.delete(detailId);
  }
}

