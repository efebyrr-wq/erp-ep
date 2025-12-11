import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Supplier,
  SupplierContactPerson,
  Supply,
} from '../entities';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    @InjectRepository(SupplierContactPerson)
    private readonly supplierContactsRepository: Repository<SupplierContactPerson>,
    @InjectRepository(Supply)
    private readonly suppliesRepository: Repository<Supply>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.suppliersRepository.find({
      relations: {
        contacts: true,
        supplies: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.suppliersRepository.create({
      name: dto.name,
      balance: dto.balance ?? '0',
    });
    const savedSupplier = await this.suppliersRepository.save(supplier);

    if (dto.contacts?.length) {
      const contacts = dto.contacts.map((contact) =>
        this.supplierContactsRepository.create({
          supplierId: savedSupplier.id,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        }),
      );
      await this.supplierContactsRepository.save(contacts);
    }

    if (dto.supplies?.length) {
      const supplies = dto.supplies.map((supply) =>
        this.suppliesRepository.create({
          supplierId: savedSupplier.id,
          type: supply.type,
          productName: supply.productName,
          quantity: Number(supply.quantity),
          price: supply.price,
        }),
      );
      await this.suppliesRepository.save(supplies);
    }

    return this.suppliersRepository.findOneOrFail({
      where: { id: savedSupplier.id },
      relations: {
        contacts: true,
        supplies: true,
      },
    });
  }

  async createSupply(
    supplierId: string,
    dto: { type: string; productName: string; quantity: string; price: string },
  ): Promise<Supply> {
    // ensure supplier exists (optional: could throw if not)
    await this.suppliersRepository.findOneOrFail({ where: { id: supplierId } });
    const supply = this.suppliesRepository.create({
      supplierId,
      type: dto.type,
      productName: dto.productName,
      quantity: Number(dto.quantity),
      price: dto.price,
    });
    return this.suppliesRepository.save(supply);
  }

  async update(id: string, dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOneOrFail({ where: { id } });

    // Update supplier basic info
    supplier.name = dto.name;
    if (dto.balance !== undefined) {
      supplier.balance = dto.balance;
    }
    await this.suppliersRepository.save(supplier);

    // Delete existing contacts and supplies
    const existingContacts = await this.supplierContactsRepository.find({
      where: { supplierId: id },
    });
    if (existingContacts.length > 0) {
      await this.supplierContactsRepository.remove(existingContacts);
    }

    const existingSupplies = await this.suppliesRepository.find({
      where: { supplierId: id },
    });
    if (existingSupplies.length > 0) {
      await this.suppliesRepository.remove(existingSupplies);
    }

    // Create new contacts if provided
    if (dto.contacts?.length) {
      const contacts = dto.contacts.map((contact) =>
        this.supplierContactsRepository.create({
          supplierId: id,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
        }),
      );
      await this.supplierContactsRepository.save(contacts);
    }

    // Create new supplies if provided
    if (dto.supplies?.length) {
      const supplies = dto.supplies.map((supply) =>
        this.suppliesRepository.create({
          supplierId: id,
          type: supply.type,
          productName: supply.productName,
          quantity: Number(supply.quantity),
          price: supply.price,
        }),
      );
      await this.suppliesRepository.save(supplies);
    }

    return this.suppliersRepository.findOneOrFail({
      where: { id },
      relations: {
        contacts: true,
        supplies: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.suppliersRepository.findOneOrFail({
      where: { id },
      relations: {
        contacts: true,
        supplies: true,
      },
    });

    // Delete related contacts
    if (supplier.contacts && supplier.contacts.length > 0) {
      await this.supplierContactsRepository.remove(supplier.contacts);
    }

    // Delete related supplies
    if (supplier.supplies && supplier.supplies.length > 0) {
      await this.suppliesRepository.remove(supplier.supplies);
    }

    // Delete the supplier
    await this.suppliersRepository.remove(supplier);
  }
}






