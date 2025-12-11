import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Outsourcer,
  OutsourcerContactPerson,
} from '../entities';
import { CreateOutsourcerDto } from './dto/create-outsourcer.dto';

@Injectable()
export class OutsourcersService {
  constructor(
    @InjectRepository(Outsourcer)
    private readonly outsourcersRepository: Repository<Outsourcer>,
    @InjectRepository(OutsourcerContactPerson)
    private readonly outsourcerContactsRepository: Repository<OutsourcerContactPerson>,
  ) {}

  async findAll(): Promise<Outsourcer[]> {
    return this.outsourcersRepository.find({
      relations: {
        contacts: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async create(dto: CreateOutsourcerDto): Promise<Outsourcer> {
    const outsourcer = this.outsourcersRepository.create({
      name: dto.name,
      balance: dto.balance ?? '0',
    });
    const savedOutsourcer = await this.outsourcersRepository.save(outsourcer);

    if (dto.contacts?.length) {
      const contacts = dto.contacts
        .filter((contact) => contact.name)
        .map((contact) =>
          this.outsourcerContactsRepository.create({
            outsourcerId: savedOutsourcer.id,
            name: contact.name,
            role: contact.role ?? null,
            email: contact.email ?? null,
            phoneNumber: contact.phoneNumber ?? null,
          }),
        );
      await this.outsourcerContactsRepository.save(contacts);
    }

    return this.outsourcersRepository.findOneOrFail({
      where: { id: savedOutsourcer.id },
      relations: {
        contacts: true,
      },
    });
  }

  async update(id: string, dto: CreateOutsourcerDto): Promise<Outsourcer> {
    const outsourcer = await this.outsourcersRepository.findOneOrFail({ where: { id } });

    // Update outsourcer basic info
    outsourcer.name = dto.name;
    if (dto.balance !== undefined) {
      outsourcer.balance = dto.balance;
    }
    await this.outsourcersRepository.save(outsourcer);

    // Delete existing contacts
    const existingContacts = await this.outsourcerContactsRepository.find({
      where: { outsourcerId: id },
    });
    if (existingContacts.length > 0) {
      await this.outsourcerContactsRepository.remove(existingContacts);
    }

    // Create new contacts if provided
    if (dto.contacts?.length) {
      const contacts = dto.contacts
        .filter((contact) => contact.name)
        .map((contact) =>
          this.outsourcerContactsRepository.create({
            outsourcerId: id,
            name: contact.name,
            role: contact.role ?? null,
            email: contact.email ?? null,
            phoneNumber: contact.phoneNumber ?? null,
          }),
        );
      await this.outsourcerContactsRepository.save(contacts);
    }

    return this.outsourcersRepository.findOneOrFail({
      where: { id },
      relations: {
        contacts: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const outsourcer = await this.outsourcersRepository.findOneOrFail({
      where: { id },
      relations: {
        contacts: true,
      },
    });

    // Delete related contacts
    if (outsourcer.contacts && outsourcer.contacts.length > 0) {
      await this.outsourcerContactsRepository.remove(outsourcer.contacts);
    }

    // Delete the outsourcer
    await this.outsourcersRepository.remove(outsourcer);
  }
}











