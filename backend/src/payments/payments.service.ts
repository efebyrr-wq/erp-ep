import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentsCheck,
  PaymentCreditCard,
  PaymentsCash,
  Customer,
  Account,
  Supplier,
} from '../entities';
import { CreatePaymentCheckDto } from './dto/create-payment-check.dto';
import { UpdatePaymentCheckDto } from './dto/update-payment-check.dto';
import { CreatePaymentCreditCardDto } from './dto/create-payment-credit-card.dto';
import { UpdatePaymentCreditCardDto } from './dto/update-payment-credit-card.dto';
import { CreatePaymentCashDto } from './dto/create-payment-cash.dto';
import { UpdatePaymentCashDto } from './dto/update-payment-cash.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentsCheck)
    private readonly paymentCheckRepository: Repository<PaymentsCheck>,
    @InjectRepository(PaymentCreditCard)
    private readonly paymentCreditCardRepository: Repository<PaymentCreditCard>,
    @InjectRepository(PaymentsCash)
    private readonly paymentsCashRepository: Repository<PaymentsCash>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
  ) {}

  async findAllCheck(): Promise<PaymentsCheck[]> {
    try {
      // First, try to add the column if it doesn't exist (safe operation)
      try {
        await this.paymentCheckRepository.query(`
          ALTER TABLE public.payments_check
          ADD COLUMN IF NOT EXISTS customer_name TEXT
        `);
      } catch (alterError: any) {
        // Column might already exist, or database connection issue
        if (alterError.code === 'ECONNREFUSED' || alterError.code === 'ENOTFOUND' || alterError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        console.log('[PaymentsService] customer_name column check:', alterError.message);
      }

      // Check if customer_name column exists by trying to query it
      let hasCustomerNameColumn = false;
      try {
        const testQuery = await this.paymentCheckRepository.query(`
          SELECT customer_name FROM public.payments_check LIMIT 1
        `);
        hasCustomerNameColumn = true;
      } catch (testError: any) {
        if (testError.code === 'ECONNREFUSED' || testError.code === 'ENOTFOUND' || testError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        hasCustomerNameColumn = false;
      }

      // Use raw SQL - include customer_name only if column exists
      let result: any[];
      if (hasCustomerNameColumn) {
        result = await this.paymentCheckRepository.query(
          `SELECT payment_check_id as id, collector_name as "collectorName", check_date as "checkDate", 
           amount, collection_date as "collectionDate", account_name as "accountName", 
           customer_name as "customerName", notes
           FROM public.payments_check 
           ORDER BY check_date DESC NULLS LAST`
        );
      } else {
        result = await this.paymentCheckRepository.query(
          `SELECT payment_check_id as id, collector_name as "collectorName", check_date as "checkDate", 
           amount, collection_date as "collectionDate", account_name as "accountName", notes
           FROM public.payments_check 
           ORDER BY check_date DESC NULLS LAST`
        );
      }

      return result.map((row: any) => ({
        id: String(row.id),
        collectorName: row.collectorName,
        checkDate: row.checkDate,
        amount: row.amount,
        collectionDate: row.collectionDate,
        accountName: row.accountName,
        customerName: row.customerName || null,
        notes: row.notes,
      }));
    } catch (error: any) {
      // Check if it's a database connection error - return empty array instead of throwing
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.warn('[PaymentsService] Database connection failed. Returning empty array. Error:', error.message);
        return [];
      }
      console.error('[PaymentsService] Error in findAllCheck:', error.message);
      console.error('[PaymentsService] Error stack:', error.stack);
      // Return empty array on any error
      return [];
    }
  }

  async createCheck(dto: CreatePaymentCheckDto): Promise<PaymentsCheck> {
    const customerName = (dto as any).customerName || null;
    const payment = this.paymentCheckRepository.create({
      collectorName: dto.collectorName,
      checkDate: dto.checkDate,
      amount: dto.amount,
      collectionDate: dto.collectionDate,
      accountName: dto.accountName,
      customerName: customerName,
      notes: dto.notes ?? null,
    });
    const savedPayment = await this.paymentCheckRepository.save(payment);

    // Update customer balance if customerName is provided
    // Payments reduce customer balance (money going out)
    if (customerName && dto.amount) {
      try {
        console.log(`[createCheck] ===== CUSTOMER BALANCE UPDATE START =====`);
        console.log(`[createCheck] Looking for customer with name: "${customerName}"`);
        console.log(`[createCheck] Amount to subtract: ${dto.amount}`);
        
        // Try case-insensitive lookup
        const customer = await this.customersRepository
          .createQueryBuilder('customer')
          .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: customerName })
          .getOne();

        if (customer) {
          console.log(`[createCheck] ✓ Found customer: ${customer.name} (ID: ${customer.id})`);
          console.log(`[createCheck] Current balance: ${customer.balance}`);
          
          const currentBalance = parseFloat(customer.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);

          console.log(`[createCheck] Calculating: ${currentBalance} - ${paymentAmount} = ${newBalance}`);

          const updateResult = await this.customersRepository.query(
            `UPDATE public.customers SET balance = $1 WHERE id = $2`,
            [newBalance, customer.id]
          );
          
          console.log(`[createCheck] Update query result:`, updateResult);

          // Verify the update
          const updatedCustomer = await this.customersRepository.findOne({ where: { id: customer.id } });
          console.log(`[createCheck] ✓ Verified updated balance: ${updatedCustomer?.balance}`);
          console.log(`[createCheck] ===== CUSTOMER BALANCE UPDATE SUCCESS =====`);
        } else {
          console.warn(`[createCheck] ✗ Customer not found with name: "${customerName}"`);
          // List all customers for debugging
          const allCustomers = await this.customersRepository.find();
          console.warn(`[createCheck] Available customers:`, allCustomers.map(c => c.name));
        }
      } catch (error) {
        console.error('[createCheck] ✗ ERROR updating customer balance:', error);
        console.error('[createCheck] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        // Don't fail payment creation if balance update fails
      }
    } else {
      console.log(`[createCheck] ⚠ Skipping customer balance update - customerName: "${customerName}", amount: "${dto.amount}"`);
    }

    // Update account balance if accountName is provided
    // Payments reduce account balance (money going out)
    if (dto.accountName && dto.amount) {
      try {
        console.log(`[createCheck] ===== ACCOUNT BALANCE UPDATE START =====`);
        console.log(`[createCheck] Looking for account with name: "${dto.accountName}"`);
        console.log(`[createCheck] Amount to subtract: ${dto.amount}`);
        
        // Try case-insensitive lookup - use database column name in raw SQL
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(account.account_name) = LOWER(:accountName)', { accountName: dto.accountName })
          .getOne();

        if (account) {
          console.log(`[createCheck] ✓ Found account: ${account.accountName} (ID: ${account.id})`);
          console.log(`[createCheck] Current balance: ${account.balance}`);
          
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);

          console.log(`[createCheck] Calculating: ${currentBalance} - ${paymentAmount} = ${newBalance}`);

          const updateResult = await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [newBalance, account.id]
          );
          
          console.log(`[createCheck] Update query result:`, updateResult);

          // Verify the update
          const updatedAccount = await this.accountsRepository.findOne({ where: { id: account.id } });
          console.log(`[createCheck] ✓ Verified updated balance: ${updatedAccount?.balance}`);
          console.log(`[createCheck] ===== ACCOUNT BALANCE UPDATE SUCCESS =====`);
        } else {
          console.warn(`[createCheck] ✗ Account not found with name: "${dto.accountName}"`);
          // List all accounts for debugging
          const allAccounts = await this.accountsRepository.find();
          console.warn(`[createCheck] Available accounts:`, allAccounts.map(a => a.accountName));
        }
      } catch (error) {
        console.error('[createCheck] ✗ ERROR updating account balance:', error);
        console.error('[createCheck] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        // Don't fail payment creation if balance update fails
      }
    } else {
      console.log(`[createCheck] ⚠ Skipping account balance update - accountName: "${dto.accountName}", amount: "${dto.amount}"`);
    }

    return savedPayment;
  }

  async updateCheck(id: string, dto: UpdatePaymentCheckDto): Promise<PaymentsCheck> {
    const payment = await this.paymentCheckRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment check with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = payment.amount ? parseFloat(payment.amount) : 0;
    const oldCustomerName = payment.customerName;
    const oldAccountName = payment.accountName;

    if (dto.collectorName !== undefined) payment.collectorName = dto.collectorName;
    if (dto.checkDate !== undefined) payment.checkDate = dto.checkDate;
    if (dto.amount !== undefined) payment.amount = dto.amount;
    if (dto.collectionDate !== undefined) payment.collectionDate = dto.collectionDate;
    if (dto.accountName !== undefined) payment.accountName = dto.accountName;
    if ((dto as any).customerName !== undefined) payment.customerName = (dto as any).customerName || null;
    if (dto.notes !== undefined) payment.notes = dto.notes;

    const savedPayment = await this.paymentCheckRepository.save(payment);

    // Update customer balance: restore old amount, then subtract new amount
    const newAmount = dto.amount ? parseFloat(dto.amount) : 0;
    const newCustomerName = (dto as any).customerName !== undefined ? ((dto as any).customerName || null) : oldCustomerName;
    const amountDifference = newAmount - oldAmount;

    // If customer changed or amount changed, update balances
    if (oldCustomerName || newCustomerName) {
      // Restore old customer balance (add back old amount)
      if (oldCustomerName && oldAmount > 0) {
        try {
          console.log(`[updateCheck] Restoring old customer balance for: "${oldCustomerName}"`);
          const oldCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (oldCustomer) {
            const currentBalance = parseFloat(oldCustomer.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [restoredBalance, oldCustomer.id]
            );
            console.log(`[updateCheck] Restored customer ${oldCustomerName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`);
          } else {
            console.warn(`[updateCheck] Old customer not found for restoring balance: "${oldCustomerName}"`);
          }
        } catch (error) {
          console.error('[updateCheck] Error restoring old customer balance:', error);
        }
      }

      // Apply new customer balance (subtract new amount)
      if (newCustomerName && newAmount > 0) {
        try {
          console.log(`[updateCheck] Applying new customer balance for: "${newCustomerName}"`);
          const newCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: newCustomerName })
            .getOne();
          if (newCustomer) {
            const currentBalance = parseFloat(newCustomer.balance || '0') || 0;
            const newBalance = (currentBalance - newAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, newCustomer.id]
            );
            console.log(`[updateCheck] Updated customer ${newCustomerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${newAmount})`);
          } else {
            console.warn(`[updateCheck] New customer not found for applying balance: "${newCustomerName}"`);
          }
        } catch (error) {
          console.error('[updateCheck] Error updating new customer balance:', error);
        }
      } else if (oldCustomerName === newCustomerName && amountDifference !== 0) {
        // Same customer, just amount changed - adjust by difference
        try {
          console.log(`[updateCheck] Adjusting customer balance for: "${oldCustomerName}" by difference`);
          const customer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (customer) {
            const currentBalance = parseFloat(customer.balance || '0') || 0;
            const newBalance = (currentBalance - amountDifference).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, customer.id]
            );
            console.log(`Adjusted customer ${oldCustomerName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('Error adjusting customer balance:', error);
        }
      }
    }

    // Update account balance: restore old amount, then subtract new amount
    const newAccountAmount = dto.amount ? parseFloat(dto.amount) : 0;
    const newAccountName = dto.accountName !== undefined ? (dto.accountName || null) : oldAccountName;
    const accountAmountDifference = newAccountAmount - oldAmount;

    if (oldAccountName || newAccountName) {
      // Restore old account balance (add back old amount)
      if (oldAccountName && oldAmount > 0) {
        try {
          const oldAccount = await this.accountsRepository.findOne({
            where: { accountName: oldAccountName },
          });
          if (oldAccount) {
            const currentBalance = parseFloat(oldAccount.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [restoredBalance, oldAccount.id]
            );
            console.log(`Restored account ${oldAccountName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`);
          }
        } catch (error) {
          console.error('Error restoring old account balance:', error);
        }
      }

      // Apply new account balance (subtract new amount)
      if (newAccountName && newAccountAmount > 0) {
        try {
          const newAccount = await this.accountsRepository.findOne({
            where: { accountName: newAccountName },
          });
          if (newAccount) {
            const currentBalance = parseFloat(newAccount.balance || '0') || 0;
            const newBalance = (currentBalance - newAccountAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, newAccount.id]
            );
            console.log(`Updated account ${newAccountName} balance: ${currentBalance} -> ${newBalance} (subtracted ${newAccountAmount})`);
          }
        } catch (error) {
          console.error('Error updating new account balance:', error);
        }
      } else if (oldAccountName === newAccountName && accountAmountDifference !== 0) {
        // Same account, just amount changed - adjust by difference
        try {
          if (!oldAccountName) {
            throw new Error('oldAccountName is null');
          }
          const account = await this.accountsRepository.findOne({
            where: { accountName: oldAccountName },
          });
          if (account) {
            const currentBalance = parseFloat(account.balance || '0') || 0;
            const newBalance = (currentBalance - accountAmountDifference).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, account.id]
            );
            console.log(`Adjusted account ${oldAccountName} balance by ${accountAmountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('Error adjusting account balance:', error);
        }
      }
    }

    return savedPayment;
  }

  async removeCheck(id: string): Promise<void> {
    const payment = await this.paymentCheckRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment check with ID ${id} not found`);
    }

    await this.paymentCheckRepository.remove(payment);
  }

  async findAllCreditCard(): Promise<PaymentCreditCard[]> {
    try {
      // First, try to add the column if it doesn't exist (safe operation)
      try {
        await this.paymentCreditCardRepository.query(`
          ALTER TABLE public.payment_credit_card
          ADD COLUMN IF NOT EXISTS customer_name TEXT
        `);
      } catch (alterError: any) {
        // Column might already exist, or database connection issue
        if (alterError.code === 'ECONNREFUSED' || alterError.code === 'ENOTFOUND' || alterError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        console.log('[PaymentsService] customer_name column check:', alterError.message);
      }

      // Check if customer_name column exists by trying to query it
      let hasCustomerNameColumn = false;
      try {
        const testQuery = await this.paymentCreditCardRepository.query(`
          SELECT customer_name FROM public.payment_credit_card LIMIT 1
        `);
        hasCustomerNameColumn = true;
      } catch (testError: any) {
        if (testError.code === 'ECONNREFUSED' || testError.code === 'ENOTFOUND' || testError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        hasCustomerNameColumn = false;
      }

      // Use raw SQL - include customer_name only if column exists
      let result: any[];
      if (hasCustomerNameColumn) {
        result = await this.paymentCreditCardRepository.query(
          `SELECT payment_credit_card_id as id, collector_name as "collectorName", transaction_date as "transactionDate", 
           amount, payment_from as "paymentFrom", credit_card_fee as "creditCardFee", notes, 
           installment_period as "installmentPeriod", customer_name as "customerName"
           FROM public.payment_credit_card 
           ORDER BY transaction_date DESC NULLS LAST`
        );
      } else {
        result = await this.paymentCreditCardRepository.query(
          `SELECT payment_credit_card_id as id, collector_name as "collectorName", transaction_date as "transactionDate", 
           amount, payment_from as "paymentFrom", credit_card_fee as "creditCardFee", notes, 
           installment_period as "installmentPeriod"
           FROM public.payment_credit_card 
           ORDER BY transaction_date DESC NULLS LAST`
        );
      }

      return result.map((row: any) => ({
        id: String(row.id),
        collectorName: row.collectorName,
        transactionDate: row.transactionDate,
        amount: row.amount,
        paymentFrom: row.paymentFrom,
        creditCardFee: row.creditCardFee,
        notes: row.notes,
        installmentPeriod: row.installmentPeriod,
        customerName: row.customerName || null,
      }));
    } catch (error: any) {
      // Check if it's a database connection error - return empty array instead of throwing
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.warn('[PaymentsService] Database connection failed. Returning empty array. Error:', error.message);
        return [];
      }
      console.error('[PaymentsService] Error in findAllCreditCard:', error.message);
      console.error('[PaymentsService] Error stack:', error.stack);
      // Return empty array on any error
      return [];
    }
  }

  async createCreditCard(dto: CreatePaymentCreditCardDto): Promise<PaymentCreditCard> {
    const customerName = (dto as any).customerName || null;
    const payment = this.paymentCreditCardRepository.create({
      collectorName: dto.collectorName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      paymentFrom: dto.paymentFrom,
      creditCardFee: dto.creditCardFee ?? null,
      notes: dto.notes ?? null,
      installmentPeriod: dto.installmentPeriod ?? null,
      customerName: customerName,
    });
    const savedPayment = await this.paymentCreditCardRepository.save(payment);

    // Update customer balance if customerName is provided
    if (customerName && dto.amount) {
      try {
        console.log(`[createCreditCard] Looking for customer with name: "${customerName}"`);
        // Use case-insensitive lookup
        const customer = await this.customersRepository
          .createQueryBuilder('customer')
          .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: customerName })
          .getOne();

        if (customer) {
          console.log(`[createCreditCard] Found customer: ${customer.name}, current balance: ${customer.balance}`);
          const currentBalance = parseFloat(customer.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);

          await this.customersRepository.query(
            `UPDATE public.customers SET balance = $1 WHERE id = $2`,
            [newBalance, customer.id]
          );

          console.log(`[createCreditCard] Updated customer ${customerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${paymentAmount} from payment)`);
        } else {
          console.warn(`[createCreditCard] Customer not found with name: "${customerName}"`);
        }
      } catch (error) {
        console.error('[createCreditCard] Error updating customer balance:', error);
      }
    } else {
      console.log(`[createCreditCard] Skipping customer balance update - customerName: ${customerName}, amount: ${dto.amount}`);
    }

    // Update supplier balance if collectorName matches a supplier
    if (dto.collectorName && dto.amount) {
      try {
        const supplier = await this.suppliersRepository
          .createQueryBuilder('supplier')
          .where('LOWER(supplier.name) = LOWER(:name)', { name: dto.collectorName })
          .getOne();
        if (supplier) {
          const currentBalance = parseFloat(supplier.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);
          await this.suppliersRepository.query(
            `UPDATE public.suppliers SET balance = $1 WHERE id = $2`,
            [newBalance, supplier.id],
          );
          console.log(
            `[payments][createCreditCard] Updated supplier ${dto.collectorName} balance: ${currentBalance} -> ${newBalance} (subtracted ${paymentAmount})`,
          );
        } else {
          console.warn(`[payments][createCreditCard] Supplier not found: "${dto.collectorName}"`);
        }
      } catch (error) {
        console.error('[payments][createCreditCard] Error updating supplier balance:', error);
      }
    }

    return savedPayment;
  }

  async updateCreditCard(id: string, dto: UpdatePaymentCreditCardDto): Promise<PaymentCreditCard> {
    const payment = await this.paymentCreditCardRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment credit card with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = payment.amount ? parseFloat(payment.amount) : 0;
    const oldCustomerName = payment.customerName;
    const oldCollectorName = payment.collectorName;

    if (dto.collectorName !== undefined) payment.collectorName = dto.collectorName;
    if (dto.transactionDate !== undefined) payment.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) payment.amount = dto.amount;
    if (dto.paymentFrom !== undefined) payment.paymentFrom = dto.paymentFrom;
    if (dto.creditCardFee !== undefined) payment.creditCardFee = dto.creditCardFee;
    if (dto.notes !== undefined) payment.notes = dto.notes;
    if (dto.installmentPeriod !== undefined) payment.installmentPeriod = dto.installmentPeriod;
    if ((dto as any).customerName !== undefined) payment.customerName = (dto as any).customerName || null;

    const savedPayment = await this.paymentCreditCardRepository.save(payment);

    // Update customer balance: restore old amount, then subtract new amount
    const creditCardNewAmount = dto.amount ? parseFloat(dto.amount) : 0;
    const newCustomerName = (dto as any).customerName !== undefined ? ((dto as any).customerName || null) : oldCustomerName;
    const amountDifference = creditCardNewAmount - oldAmount;

    if (oldCustomerName || newCustomerName) {
      if (oldCustomerName && oldAmount > 0) {
        try {
          const oldCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (oldCustomer) {
            const currentBalance = parseFloat(oldCustomer.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [restoredBalance, oldCustomer.id]
            );
            console.log(`Restored customer ${oldCustomerName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`);
          }
        } catch (error) {
          console.error('Error restoring old customer balance:', error);
        }
      }

      if (newCustomerName && creditCardNewAmount > 0) {
        try {
          const newCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: newCustomerName })
            .getOne();
          if (newCustomer) {
            const currentBalance = parseFloat(newCustomer.balance || '0') || 0;
            const newBalance = (currentBalance - creditCardNewAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, newCustomer.id]
            );
            console.log(`Updated customer ${newCustomerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${creditCardNewAmount})`);
          }
        } catch (error) {
          console.error('Error updating new customer balance:', error);
        }
      } else if (oldCustomerName === newCustomerName && amountDifference !== 0) {
        try {
          const customer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (customer) {
            const currentBalance = parseFloat(customer.balance || '0') || 0;
            const newBalance = (currentBalance - amountDifference).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, customer.id]
            );
            console.log(`Adjusted customer ${oldCustomerName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('Error adjusting customer balance:', error);
        }
      }
    }

    // Update supplier balance: restore old collector, apply new collector
    const newCollectorName =
      dto.collectorName !== undefined ? (dto.collectorName || null) : oldCollectorName;

    if (oldCollectorName || newCollectorName) {
      // Restore old supplier balance (add back old amount)
      if (oldCollectorName && oldAmount > 0) {
        try {
          const oldSupplier = await this.suppliersRepository
            .createQueryBuilder('supplier')
            .where('LOWER(supplier.name) = LOWER(:name)', { name: oldCollectorName })
            .getOne();
          if (oldSupplier) {
            const currentBalance = parseFloat(oldSupplier.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.suppliersRepository.query(
              `UPDATE public.suppliers SET balance = $1 WHERE id = $2`,
              [restoredBalance, oldSupplier.id],
            );
            console.log(
              `[payments][updateCreditCard] Restored supplier ${oldCollectorName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`,
            );
          }
        } catch (error) {
          console.error('[payments][updateCreditCard] Error restoring supplier balance:', error);
        }
      }

      // Apply new supplier balance (subtract new amount)
      if (newCollectorName && creditCardNewAmount > 0) {
        try {
          const newSupplier = await this.suppliersRepository
            .createQueryBuilder('supplier')
            .where('LOWER(supplier.name) = LOWER(:name)', { name: newCollectorName })
            .getOne();
          if (newSupplier) {
            const currentBalance = parseFloat(newSupplier.balance || '0') || 0;
            const newBalance = (currentBalance - creditCardNewAmount).toFixed(2);
            await this.suppliersRepository.query(
              `UPDATE public.suppliers SET balance = $1 WHERE id = $2`,
              [newBalance, newSupplier.id],
            );
            console.log(
              `[payments][updateCreditCard] Updated supplier ${newCollectorName} balance: ${currentBalance} -> ${newBalance} (subtracted ${creditCardNewAmount})`,
            );
          }
        } catch (error) {
          console.error('[payments][updateCreditCard] Error updating supplier balance:', error);
        }
      } else if (oldCollectorName === newCollectorName && amountDifference !== 0 && newCollectorName) {
        try {
          const supplier = await this.suppliersRepository
            .createQueryBuilder('supplier')
            .where('LOWER(supplier.name) = LOWER(:name)', { name: newCollectorName })
            .getOne();
          if (supplier) {
            const currentBalance = parseFloat(supplier.balance || '0') || 0;
            const newBalance = (currentBalance - amountDifference).toFixed(2);
            await this.suppliersRepository.query(
              `UPDATE public.suppliers SET balance = $1 WHERE id = $2`,
              [newBalance, supplier.id],
            );
            console.log(
              `[payments][updateCreditCard] Adjusted supplier ${newCollectorName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`,
            );
          }
        } catch (error) {
          console.error('[payments][updateCreditCard] Error adjusting supplier balance:', error);
        }
      }
    }

    return savedPayment;
  }

  async removeCreditCard(id: string): Promise<void> {
    const payment = await this.paymentCreditCardRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment credit card with ID ${id} not found`);
    }

    await this.paymentCreditCardRepository.remove(payment);
  }

  async findAllCash(): Promise<PaymentsCash[]> {
    try {
      // First, try to add the column if it doesn't exist (safe operation)
      try {
        await this.paymentsCashRepository.query(`
          ALTER TABLE public.payments_cash
          ADD COLUMN IF NOT EXISTS customer_name TEXT
        `);
      } catch (alterError: any) {
        // Column might already exist, or database connection issue
        if (alterError.code === 'ECONNREFUSED' || alterError.code === 'ENOTFOUND' || alterError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        console.log('[PaymentsService] customer_name column check:', alterError.message);
      }

      // Check if customer_name column exists by trying to query it
      let hasCustomerNameColumn = false;
      try {
        const testQuery = await this.paymentsCashRepository.query(`
          SELECT customer_name FROM public.payments_cash LIMIT 1
        `);
        hasCustomerNameColumn = true;
      } catch (testError: any) {
        if (testError.code === 'ECONNREFUSED' || testError.code === 'ENOTFOUND' || testError.code === 'ETIMEDOUT') {
          console.warn('[PaymentsService] Database not available, returning empty array');
          return [];
        }
        hasCustomerNameColumn = false;
      }

      // Use raw SQL - include customer_name only if column exists
      let result: any[];
      if (hasCustomerNameColumn) {
        result = await this.paymentsCashRepository.query(
          `SELECT payment_cash_id as id, collector_name as "collectorName", transaction_date as "transactionDate", 
           amount, account_name as "accountName", customer_name as "customerName", notes
           FROM public.payments_cash 
           ORDER BY transaction_date DESC NULLS LAST`
        );
      } else {
        result = await this.paymentsCashRepository.query(
          `SELECT payment_cash_id as id, collector_name as "collectorName", transaction_date as "transactionDate", 
           amount, account_name as "accountName", notes
           FROM public.payments_cash 
           ORDER BY transaction_date DESC NULLS LAST`
        );
      }

      return result.map((row: any) => ({
        id: String(row.id),
        collectorName: row.collectorName,
        transactionDate: row.transactionDate,
        amount: row.amount,
        accountName: row.accountName,
        customerName: row.customerName || null,
        notes: row.notes,
      }));
    } catch (error: any) {
      // Check if it's a database connection error - return empty array instead of throwing
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.warn('[PaymentsService] Database connection failed. Returning empty array. Error:', error.message);
        return [];
      }
      console.error('[PaymentsService] Error in findAllCash:', error.message);
      console.error('[PaymentsService] Error stack:', error.stack);
      // Return empty array on any error
      return [];
    }
  }

  async createCash(dto: CreatePaymentCashDto): Promise<PaymentsCash> {
    const customerName = (dto as any).customerName || null;
    const payment = this.paymentsCashRepository.create({
      collectorName: dto.collectorName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      accountName: dto.accountName,
      customerName: customerName,
      notes: dto.notes ?? null,
    });
    const savedPayment = await this.paymentsCashRepository.save(payment);

    // Update customer balance if customerName is provided
    if (customerName && dto.amount) {
      try {
        console.log(`[createCash] Looking for customer with name: "${customerName}"`);
        // Try case-insensitive lookup
        const customer = await this.customersRepository
          .createQueryBuilder('customer')
          .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: customerName })
          .getOne();

        if (customer) {
          console.log(`[createCash] Found customer: ${customer.name}, current balance: ${customer.balance}`);
          const currentBalance = parseFloat(customer.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);

          await this.customersRepository.query(
            `UPDATE public.customers SET balance = $1 WHERE id = $2`,
            [newBalance, customer.id]
          );

          console.log(`[createCash] Updated customer ${customerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${paymentAmount} from payment)`);
        } else {
          console.warn(`[createCash] Customer not found with name: "${customerName}"`);
        }
      } catch (error) {
        console.error('[createCash] Error updating customer balance:', error);
      }
    } else {
      console.log(`[createCash] Skipping customer balance update - customerName: ${customerName}, amount: ${dto.amount}`);
    }

    // Update account balance if accountName is provided
    // Payments reduce account balance (money going out)
    if (dto.accountName && dto.amount) {
      try {
        console.log(`[createCash] Looking for account with name: "${dto.accountName}"`);
        // Try case-insensitive lookup - use database column name in raw SQL
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(account.account_name) = LOWER(:accountName)', { accountName: dto.accountName })
          .getOne();

        if (account) {
          console.log(`[createCash] Found account: ${account.accountName}, current balance: ${account.balance}`);
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const paymentAmount = parseFloat(dto.amount) || 0;
          const newBalance = (currentBalance - paymentAmount).toFixed(2);

          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [newBalance, account.id]
          );

          console.log(`[createCash] Updated account ${dto.accountName} balance: ${currentBalance} -> ${newBalance} (subtracted ${paymentAmount} from payment)`);
        } else {
          console.warn(`[createCash] Account not found with name: "${dto.accountName}"`);
        }
      } catch (error) {
        console.error('[createCash] Error updating account balance:', error);
        // Don't fail payment creation if balance update fails
      }
    } else {
      console.log(`[createCash] Skipping account balance update - accountName: ${dto.accountName}, amount: ${dto.amount}`);
    }

    return savedPayment;
  }

  async updateCash(id: string, dto: UpdatePaymentCashDto): Promise<PaymentsCash> {
    const payment = await this.paymentsCashRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment cash with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = payment.amount ? parseFloat(payment.amount) : 0;
    const oldCustomerName = payment.customerName;
    const oldAccountName = payment.accountName;

    if (dto.collectorName !== undefined) payment.collectorName = dto.collectorName;
    if (dto.transactionDate !== undefined) payment.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) payment.amount = dto.amount;
    if (dto.accountName !== undefined) payment.accountName = dto.accountName;
    if ((dto as any).customerName !== undefined) payment.customerName = (dto as any).customerName || null;
    if (dto.notes !== undefined) payment.notes = dto.notes;

    const savedPayment = await this.paymentsCashRepository.save(payment);

    // Update customer balance: restore old amount, then subtract new amount
    const cashNewAmount = dto.amount ? parseFloat(dto.amount) : 0;
    const newCustomerName = (dto as any).customerName !== undefined ? ((dto as any).customerName || null) : oldCustomerName;
    const amountDifference = cashNewAmount - oldAmount;

    if (oldCustomerName || newCustomerName) {
      if (oldCustomerName && oldAmount > 0) {
        try {
          const oldCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (oldCustomer) {
            const currentBalance = parseFloat(oldCustomer.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [restoredBalance, oldCustomer.id]
            );
            console.log(`Restored customer ${oldCustomerName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`);
          }
        } catch (error) {
          console.error('Error restoring old customer balance:', error);
        }
      }

      if (newCustomerName && cashNewAmount > 0) {
        try {
          const newCustomer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: newCustomerName })
            .getOne();
          if (newCustomer) {
            const currentBalance = parseFloat(newCustomer.balance || '0') || 0;
            const newBalance = (currentBalance - cashNewAmount).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, newCustomer.id]
            );
            console.log(`Updated customer ${newCustomerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${cashNewAmount})`);
          }
        } catch (error) {
          console.error('Error updating new customer balance:', error);
        }
      } else if (oldCustomerName === newCustomerName && amountDifference !== 0) {
        try {
          const customer = await this.customersRepository
            .createQueryBuilder('customer')
            .where('LOWER(customer.name) = LOWER(:customerName)', { customerName: oldCustomerName })
            .getOne();
          if (customer) {
            const currentBalance = parseFloat(customer.balance || '0') || 0;
            const newBalance = (currentBalance - amountDifference).toFixed(2);
            await this.customersRepository.query(
              `UPDATE public.customers SET balance = $1 WHERE id = $2`,
              [newBalance, customer.id]
            );
            console.log(`Adjusted customer ${oldCustomerName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('Error adjusting customer balance:', error);
        }
      }
    }

    // Update account balance: restore old amount, then subtract new amount
    const cashAccountNewAmount = dto.amount ? parseFloat(dto.amount) : 0;
    const newAccountName = dto.accountName !== undefined ? (dto.accountName || null) : oldAccountName;
    const accountAmountDifference = cashAccountNewAmount - oldAmount;

    if (oldAccountName || newAccountName) {
      // Restore old account balance (add back old amount)
      if (oldAccountName && oldAmount > 0) {
        try {
          const oldAccount = await this.accountsRepository.findOne({
            where: { accountName: oldAccountName },
          });
          if (oldAccount) {
            const currentBalance = parseFloat(oldAccount.balance || '0') || 0;
            const restoredBalance = (currentBalance + oldAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [restoredBalance, oldAccount.id]
            );
            console.log(`Restored account ${oldAccountName} balance: ${currentBalance} -> ${restoredBalance} (added back ${oldAmount})`);
          }
        } catch (error) {
          console.error('Error restoring old account balance:', error);
        }
      }

      // Apply new account balance (subtract new amount)
      if (newAccountName && cashAccountNewAmount > 0) {
        try {
          const newAccount = await this.accountsRepository.findOne({
            where: { accountName: newAccountName },
          });
          if (newAccount) {
            const currentBalance = parseFloat(newAccount.balance || '0') || 0;
            const newBalance = (currentBalance - cashAccountNewAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, newAccount.id]
            );
            console.log(`Updated account ${newAccountName} balance: ${currentBalance} -> ${newBalance} (subtracted ${cashAccountNewAmount})`);
          }
        } catch (error) {
          console.error('Error updating new account balance:', error);
        }
      } else if (oldAccountName === newAccountName && accountAmountDifference !== 0) {
        // Same account, just amount changed - adjust by difference
        try {
          const account = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(account.account_name) = LOWER(:accountName)', { accountName: oldAccountName })
            .getOne();
          if (account) {
            const currentBalance = parseFloat(account.balance || '0') || 0;
            const newBalance = (currentBalance - accountAmountDifference).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, account.id]
            );
            console.log(`Adjusted account ${oldAccountName} balance by ${accountAmountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('Error adjusting account balance:', error);
        }
      }
    }

    return savedPayment;
  }

  async removeCash(id: string): Promise<void> {
    const payment = await this.paymentsCashRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment cash with ID ${id} not found`);
    }

    await this.paymentsCashRepository.remove(payment);
  }
}

