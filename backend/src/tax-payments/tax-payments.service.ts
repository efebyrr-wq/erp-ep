import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxPayment, Account } from '../entities';
import { CreateTaxPaymentDto } from './dto/create-tax-payment.dto';
import { UpdateTaxPaymentDto } from './dto/update-tax-payment.dto';

@Injectable()
export class TaxPaymentsService {
  constructor(
    @InjectRepository(TaxPayment)
    private readonly taxPaymentRepository: Repository<TaxPayment>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async findAll(): Promise<TaxPayment[]> {
    return this.taxPaymentRepository.find({
      order: {
        paymentDate: 'DESC',
      },
    });
  }

  async findByTaxType(taxType: string): Promise<TaxPayment[]> {
    return this.taxPaymentRepository.find({
      where: { taxType },
      order: {
        paymentDate: 'DESC',
      },
    });
  }

  async create(dto: CreateTaxPaymentDto): Promise<TaxPayment> {
    // Get account to update balance
    const account = await this.accountsRepository.findOne({
      where: { id: dto.accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${dto.accountId} not found`);
    }

    // Check if account is bank or credit card
    const accountType = account.type?.toLowerCase() || '';
    const isBankOrCreditCard = 
      accountType.includes('bank') || 
      accountType.includes('credit card') ||
      accountType === 'banka hesabı' ||
      accountType === 'kredi kartı';

    if (!isBankOrCreditCard) {
      throw new Error('Ödeme sadece banka hesabı veya kredi kartı ile yapılabilir');
    }

    // Create tax payment
    const taxPayment = this.taxPaymentRepository.create({
      taxType: dto.taxType,
      amount: dto.amount,
      paymentDate: dto.paymentDate,
      accountId: dto.accountId,
      accountName: dto.accountName || account.accountName,
      notes: dto.notes || null,
    });

    const savedPayment = await this.taxPaymentRepository.save(taxPayment);

    // Update account balance (subtract payment amount)
    const currentBalance = parseFloat(account.balance || '0');
    const paymentAmount = parseFloat(dto.amount);
    const newBalance = currentBalance - paymentAmount;
    
    account.balance = newBalance.toFixed(2);
    await this.accountsRepository.save(account);

    return savedPayment;
  }

  async update(id: string, dto: UpdateTaxPaymentDto): Promise<TaxPayment> {
    const taxPayment = await this.taxPaymentRepository.findOne({
      where: { id },
    });

    if (!taxPayment) {
      throw new NotFoundException(`Tax payment with ID ${id} not found`);
    }

    // If amount or account changes, we need to adjust balances
    if (dto.amount !== undefined || dto.accountId !== undefined) {
      // Get old account and restore balance
      const oldAccount = await this.accountsRepository.findOne({
        where: { id: taxPayment.accountId },
      });
      
      if (oldAccount) {
        const oldBalance = parseFloat(oldAccount.balance || '0');
        const oldPaymentAmount = parseFloat(taxPayment.amount);
        oldAccount.balance = (oldBalance + oldPaymentAmount).toFixed(2);
        await this.accountsRepository.save(oldAccount);
      }

      // Get new account and subtract new amount
      const newAccountId = dto.accountId || taxPayment.accountId;
      const newAccount = await this.accountsRepository.findOne({
        where: { id: newAccountId },
      });

      if (!newAccount) {
        throw new NotFoundException(`Account with ID ${newAccountId} not found`);
      }

      const newBalance = parseFloat(newAccount.balance || '0');
      const newPaymentAmount = parseFloat(dto.amount || taxPayment.amount);
      newAccount.balance = (newBalance - newPaymentAmount).toFixed(2);
      await this.accountsRepository.save(newAccount);
    }

    // Update tax payment fields
    if (dto.taxType !== undefined) {
      taxPayment.taxType = dto.taxType;
    }
    if (dto.amount !== undefined) {
      taxPayment.amount = dto.amount;
    }
    if (dto.paymentDate !== undefined) {
      taxPayment.paymentDate = dto.paymentDate;
    }
    if (dto.accountId !== undefined) {
      taxPayment.accountId = dto.accountId;
    }
    if (dto.accountName !== undefined) {
      taxPayment.accountName = dto.accountName;
    }
    if (dto.notes !== undefined) {
      taxPayment.notes = dto.notes;
    }

    return this.taxPaymentRepository.save(taxPayment);
  }

  async remove(id: string): Promise<void> {
    const taxPayment = await this.taxPaymentRepository.findOne({
      where: { id },
    });

    if (!taxPayment) {
      throw new NotFoundException(`Tax payment with ID ${id} not found`);
    }

    // Restore account balance
    const account = await this.accountsRepository.findOne({
      where: { id: taxPayment.accountId },
    });

    if (account) {
      const currentBalance = parseFloat(account.balance || '0');
      const paymentAmount = parseFloat(taxPayment.amount);
      account.balance = (currentBalance + paymentAmount).toFixed(2);
      await this.accountsRepository.save(account);
    }

    await this.taxPaymentRepository.remove(taxPayment);
  }
}







