import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      order: {
        accountName: 'ASC',
      },
    });
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    const account = this.accountsRepository.create({
      accountName: dto.accountName,
      type: dto.type,
      balance: dto.balance ?? '0',
      cutoffDay: dto.type === 'Credit Card' ? dto.cutoffDay ?? null : null,
    });
    return this.accountsRepository.save(account);
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    if (dto.accountName !== undefined) {
      account.accountName = dto.accountName;
    }
    if (dto.type !== undefined) {
      account.type = dto.type;
      // Reset cutoffDay if not Credit Card
      if (dto.type !== 'Credit Card') {
        account.cutoffDay = null;
      }
    }
    if (dto.balance !== undefined) {
      account.balance = dto.balance;
    }
    if (dto.cutoffDay !== undefined) {
      account.cutoffDay = dto.cutoffDay;
    }

    return this.accountsRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.accountsRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    await this.accountsRepository.remove(account);
  }
}



