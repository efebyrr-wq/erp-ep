import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactPerson, Customer } from '../entities';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(ContactPerson)
    private readonly contactsRepository: Repository<ContactPerson>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find({
      relations: {
        contacts: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      name: dto.name,
      balance: dto.balance ?? '0',
      phoneNumber: dto.phoneNumber || null,
      address: dto.address || null,
      email: dto.email || null,
      vergiDairesi: dto.vergiDairesi || null,
      vkn: dto.vkn || null,
    });
    const savedCustomer = await this.customersRepository.save(customer);

    if (dto.contacts?.length) {
      const contacts = dto.contacts.map((contact) =>
        this.contactsRepository.create({
          customerId: savedCustomer.id,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        }),
      );
      await this.contactsRepository.save(contacts);
    }

    return this.customersRepository.findOneOrFail({
      where: { id: savedCustomer.id },
      relations: {
        contacts: true,
      },
    });
  }

  async update(id: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    const customer = await this.customersRepository.findOneOrFail({
      where: { id },
    });

    // Update only provided fields
    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.balance !== undefined) customer.balance = dto.balance;
    if (dto.phoneNumber !== undefined) customer.phoneNumber = dto.phoneNumber || null;
    if (dto.address !== undefined) customer.address = dto.address || null;
    if (dto.email !== undefined) customer.email = dto.email || null;
    if (dto.vergiDairesi !== undefined) customer.vergiDairesi = dto.vergiDairesi || null;
    if (dto.vkn !== undefined) customer.vkn = dto.vkn || null;

    await this.customersRepository.save(customer);

    return this.customersRepository.findOneOrFail({
      where: { id },
      relations: {
        contacts: true,
      },
    });
  }
}




