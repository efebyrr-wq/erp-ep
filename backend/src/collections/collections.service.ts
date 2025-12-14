import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CollectionsCheck,
  CollectionCreditCard,
  CollectionCash,
  Account,
} from '../entities';
import { CreateCollectionCheckDto } from './dto/create-collection-check.dto';
import { UpdateCollectionCheckDto } from './dto/update-collection-check.dto';
import { CreateCollectionCreditCardDto } from './dto/create-collection-credit-card.dto';
import { UpdateCollectionCreditCardDto } from './dto/update-collection-credit-card.dto';
import { CreateCollectionCashDto } from './dto/create-collection-cash.dto';
import { UpdateCollectionCashDto } from './dto/update-collection-cash.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionsCheck)
    private readonly collectionsCheckRepository: Repository<CollectionsCheck>,
    @InjectRepository(CollectionCreditCard)
    private readonly collectionCreditCardRepository: Repository<CollectionCreditCard>,
    @InjectRepository(CollectionCash)
    private readonly collectionCashRepository: Repository<CollectionCash>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async findAllCheck(): Promise<CollectionsCheck[]> {
    return this.collectionsCheckRepository.find({
      order: {
        collectionDate: 'DESC',
      },
    });
  }

  async createCheck(dto: CreateCollectionCheckDto): Promise<CollectionsCheck> {
    console.log('[createCheck] ===== STARTING COLLECTION CREATION =====');
    console.log('[createCheck] DTO:', JSON.stringify(dto, null, 2));
    
    const collection = this.collectionsCheckRepository.create({
      customerName: dto.customerName,
      checkDate: dto.checkDate,
      amount: dto.amount,
      collectionDate: dto.collectionDate,
      accountName: dto.accountName,
      notes: dto.notes ?? null,
    });
    
    console.log('[createCheck] Collection entity created, saving to database...');
    const saved = await this.collectionsCheckRepository.save(collection);
    console.log('[createCheck] ✅ Collection saved to database, ID:', saved.id);

    // Update account balance if accountName is provided
    // Collections increase account balance (money coming in)
    console.log(`[createCheck] DEBUG: accountName="${dto.accountName}", amount="${dto.amount}"`);
    if (dto.accountName && dto.amount) {
      try {
        console.log(`[createCheck] ===== STARTING ACCOUNT BALANCE UPDATE =====`);
        console.log(`[createCheck] Looking for account: "${dto.accountName}"`);
        console.log(`[createCheck] Collection amount: ${dto.amount}`);
        
        // List all accounts first for debugging
        const allAccounts = await this.accountsRepository.find();
        console.log(`[createCheck] All accounts in database:`, allAccounts.map(a => `"${a.accountName}" (ID: ${a.id}, Balance: ${a.balance})`));
        
        // Use case-insensitive matching with TRIM to handle whitespace differences (consistent with other methods)
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: dto.accountName })
          .getOne();

        if (account) {
          console.log(`[createCheck] ✓ Found account: ${account.accountName} (ID: ${account.id})`);
          console.log(`[createCheck] Current balance: ${account.balance}`);
          
          const collectionAmount = parseFloat(dto.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const newBalance = (currentBalance + collectionAmount).toFixed(2);

          console.log(`[createCheck] Calculating: ${currentBalance} + ${collectionAmount} = ${newBalance}`);

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
          console.warn(`[createCheck] Available accounts:`, allAccounts.map(a => `"${a.accountName}"`));
        }
      } catch (error) {
        console.error('[createCheck] ✗ ERROR updating account balance:', error);
        console.error('[createCheck] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        // Don't fail collection creation if balance update fails
      }
    } else {
      console.log(`[createCheck] ⚠ Skipping account balance update - accountName: "${dto.accountName}", amount: "${dto.amount}"`);
    }

    return saved;
  }

  async updateCheck(id: string, dto: UpdateCollectionCheckDto): Promise<CollectionsCheck> {
    const collection = await this.collectionsCheckRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection check with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = collection.amount ? parseFloat(collection.amount) : 0;
    const oldAccountName = collection.accountName;

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.checkDate !== undefined) collection.checkDate = dto.checkDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.collectionDate !== undefined) collection.collectionDate = dto.collectionDate;
    if (dto.accountName !== undefined) collection.accountName = dto.accountName;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    const updated = await this.collectionsCheckRepository.save(collection);

    // Update account balance: restore old amount, then add new amount
    const newAmount = dto.amount ? parseFloat(dto.amount) : oldAmount;
    const newAccountName = dto.accountName !== undefined ? (dto.accountName || null) : oldAccountName;
    const amountDifference = newAmount - oldAmount;

    if (oldAccountName || newAccountName) {
      // Restore old account balance (subtract old amount)
      if (oldAccountName && oldAmount > 0) {
        try {
          const oldAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldAccountName })
            .getOne();
          if (oldAccount) {
            const currentBalance = parseFloat(oldAccount.balance || '0') || 0;
            const restoredBalance = (currentBalance - oldAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [restoredBalance, oldAccount.id]
            );
            console.log(`[updateCheck] Restored account ${oldAccountName} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${oldAmount})`);
          }
        } catch (error) {
          console.error('[updateCheck] Error restoring old account balance:', error);
        }
      }

      // Apply new account balance (add new amount)
      if (newAccountName && newAmount > 0) {
        try {
          const newAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: newAccountName })
            .getOne();
          if (newAccount) {
            const currentBalance = parseFloat(newAccount.balance || '0') || 0;
            const newBalance = (currentBalance + newAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, newAccount.id]
            );
            console.log(`[updateCheck] Updated account ${newAccountName} balance: ${currentBalance} -> ${newBalance} (added ${newAmount})`);
          }
        } catch (error) {
          console.error('[updateCheck] Error updating new account balance:', error);
        }
      } else if (oldAccountName === newAccountName && amountDifference !== 0) {
        // Same account, just amount changed - adjust by difference
        try {
          if (!oldAccountName) {
            throw new Error('oldAccountName is null');
          }
          const account = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldAccountName })
            .getOne();
          if (account) {
            const currentBalance = parseFloat(account.balance || '0') || 0;
            const newBalance = (currentBalance + amountDifference).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, account.id]
            );
            console.log(`[updateCheck] Adjusted account ${oldAccountName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('[updateCheck] Error adjusting account balance:', error);
        }
      }
    }

    return updated;
  }

  async removeCheck(id: string): Promise<void> {
    const collection = await this.collectionsCheckRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection check with ID ${id} not found`);
    }

    // Restore account balance before deleting (subtract the collection amount)
    if (collection.accountName && collection.amount) {
      try {
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: collection.accountName })
          .getOne();
        if (account) {
          const collectionAmount = parseFloat(collection.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const restoredBalance = (currentBalance - collectionAmount).toFixed(2);
          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [restoredBalance, account.id]
          );
          console.log(`[removeCheck] Restored account ${collection.accountName} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${collectionAmount})`);
        }
      } catch (error) {
        console.error('[removeCheck] Error restoring account balance:', error);
        // Continue with deletion even if balance update fails
      }
    }

    await this.collectionsCheckRepository.remove(collection);
  }

  async findAllCreditCard(): Promise<CollectionCreditCard[]> {
    return this.collectionCreditCardRepository.find({
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async createCreditCard(dto: CreateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    const collection = this.collectionCreditCardRepository.create({
      customerName: dto.customerName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      paymentTo: dto.paymentTo,
      creditCardFee: dto.creditCardFee ?? null,
      notes: dto.notes ?? null,
    });
    const saved = await this.collectionCreditCardRepository.save(collection);

    // Update account balance if paymentTo is provided (for credit card collections, paymentTo is the account)
    // Collections increase account balance (money coming in)
    if (dto.paymentTo && dto.amount) {
      try {
        // Use case-insensitive matching like payments service
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: dto.paymentTo })
          .getOne();

        if (account) {
          const collectionAmount = parseFloat(dto.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const newBalance = (currentBalance + collectionAmount).toFixed(2);

          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [newBalance, account.id]
          );

          const updatedAccount = await this.accountsRepository.findOne({ where: { id: account.id } });
          console.log(`[createCreditCard] Updated account ${dto.paymentTo} balance: ${currentBalance} -> ${updatedAccount?.balance} (added ${collectionAmount} from collection)`);
        } else {
          console.warn(`[createCreditCard] Account not found with name: "${dto.paymentTo}"`);
          // List all accounts for debugging
          const allAccounts = await this.accountsRepository.find();
          console.warn(`[createCreditCard] Available accounts:`, allAccounts.map(a => a.accountName));
        }
      } catch (error) {
        console.error('[createCreditCard] Error updating account balance:', error);
        // Don't fail collection creation if balance update fails
      }
    }

    return saved;
  }

  async updateCreditCard(id: string, dto: UpdateCollectionCreditCardDto): Promise<CollectionCreditCard> {
    const collection = await this.collectionCreditCardRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection credit card with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = collection.amount ? parseFloat(collection.amount) : 0;
    const oldPaymentTo = collection.paymentTo;

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.transactionDate !== undefined) collection.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.paymentTo !== undefined) collection.paymentTo = dto.paymentTo;
    if (dto.creditCardFee !== undefined) collection.creditCardFee = dto.creditCardFee;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    const updated = await this.collectionCreditCardRepository.save(collection);

    // Update account balance: restore old amount, then add new amount
    const newAmount = dto.amount ? parseFloat(dto.amount) : oldAmount;
    const newPaymentTo = dto.paymentTo !== undefined ? (dto.paymentTo || null) : oldPaymentTo;
    const amountDifference = newAmount - oldAmount;

    if (oldPaymentTo || newPaymentTo) {
      // Restore old account balance (subtract old amount)
      if (oldPaymentTo && oldAmount > 0) {
        try {
          const oldAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldPaymentTo })
            .getOne();
          if (oldAccount) {
            const currentBalance = parseFloat(oldAccount.balance || '0') || 0;
            const restoredBalance = (currentBalance - oldAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [restoredBalance, oldAccount.id]
            );
            console.log(`[updateCreditCard] Restored account ${oldPaymentTo} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${oldAmount})`);
          }
        } catch (error) {
          console.error('[updateCreditCard] Error restoring old account balance:', error);
        }
      }

      // Apply new account balance (add new amount)
      if (newPaymentTo && newAmount > 0) {
        try {
          const newAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: newPaymentTo })
            .getOne();
          if (newAccount) {
            const currentBalance = parseFloat(newAccount.balance || '0') || 0;
            const newBalance = (currentBalance + newAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, newAccount.id]
            );
            console.log(`[updateCreditCard] Updated account ${newPaymentTo} balance: ${currentBalance} -> ${newBalance} (added ${newAmount})`);
          }
        } catch (error) {
          console.error('[updateCreditCard] Error updating new account balance:', error);
        }
      } else if (oldPaymentTo === newPaymentTo && amountDifference !== 0) {
        // Same account, just amount changed - adjust by difference
        try {
          if (!oldPaymentTo) {
            throw new Error('oldPaymentTo is null');
          }
          const account = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldPaymentTo })
            .getOne();
          if (account) {
            const currentBalance = parseFloat(account.balance || '0') || 0;
            const newBalance = (currentBalance + amountDifference).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, account.id]
            );
            console.log(`[updateCreditCard] Adjusted account ${oldPaymentTo} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('[updateCreditCard] Error adjusting account balance:', error);
        }
      }
    }

    return updated;
  }

  async removeCreditCard(id: string): Promise<void> {
    const collection = await this.collectionCreditCardRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection credit card with ID ${id} not found`);
    }

    // Restore account balance before deleting (subtract the collection amount)
    if (collection.paymentTo && collection.amount) {
      try {
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: collection.paymentTo })
          .getOne();
        if (account) {
          const collectionAmount = parseFloat(collection.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const restoredBalance = (currentBalance - collectionAmount).toFixed(2);
          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [restoredBalance, account.id]
          );
          console.log(`[removeCreditCard] Restored account ${collection.paymentTo} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${collectionAmount})`);
        }
      } catch (error) {
        console.error('[removeCreditCard] Error restoring account balance:', error);
        // Continue with deletion even if balance update fails
      }
    }

    await this.collectionCreditCardRepository.remove(collection);
  }

  async findAllCash(): Promise<CollectionCash[]> {
    return this.collectionCashRepository.find({
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async createCash(dto: CreateCollectionCashDto): Promise<CollectionCash> {
    const collection = this.collectionCashRepository.create({
      customerName: dto.customerName,
      transactionDate: dto.transactionDate,
      amount: dto.amount,
      accountName: dto.accountName,
      notes: dto.notes ?? null,
    });
    const saved = await this.collectionCashRepository.save(collection);

    // Update account balance if accountName is provided
    // Collections increase account balance (money coming in)
    if (dto.accountName && dto.amount) {
      try {
        // Use case-insensitive matching like payments service (without TRIM to match exactly)
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(account.account_name) = LOWER(:accountName)', { accountName: dto.accountName })
          .getOne();

        if (account) {
          const collectionAmount = parseFloat(dto.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const newBalance = (currentBalance + collectionAmount).toFixed(2);

          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [newBalance, account.id]
          );

          const updatedAccount = await this.accountsRepository.findOne({ where: { id: account.id } });
          console.log(`[createCash] Updated account ${dto.accountName} balance: ${currentBalance} -> ${updatedAccount?.balance} (added ${collectionAmount} from collection)`);
        } else {
          console.warn(`[createCash] Account not found with name: "${dto.accountName}"`);
          // List all accounts for debugging
          const allAccounts = await this.accountsRepository.find();
          console.warn(`[createCash] Available accounts:`, allAccounts.map(a => a.accountName));
        }
      } catch (error) {
        console.error('[createCash] Error updating account balance:', error);
        // Don't fail collection creation if balance update fails
      }
    }

    return saved;
  }

  async updateCash(id: string, dto: UpdateCollectionCashDto): Promise<CollectionCash> {
    const collection = await this.collectionCashRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection cash with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = collection.amount ? parseFloat(collection.amount) : 0;
    const oldAccountName = collection.accountName;

    if (dto.customerName !== undefined) collection.customerName = dto.customerName;
    if (dto.transactionDate !== undefined) collection.transactionDate = dto.transactionDate;
    if (dto.amount !== undefined) collection.amount = dto.amount;
    if (dto.accountName !== undefined) collection.accountName = dto.accountName;
    if (dto.notes !== undefined) collection.notes = dto.notes;

    const updated = await this.collectionCashRepository.save(collection);

    // Update account balance: restore old amount, then add new amount
    const newAmount = dto.amount ? parseFloat(dto.amount) : oldAmount;
    const newAccountName = dto.accountName !== undefined ? (dto.accountName || null) : oldAccountName;
    const amountDifference = newAmount - oldAmount;

    if (oldAccountName || newAccountName) {
      // Restore old account balance (subtract old amount)
      if (oldAccountName && oldAmount > 0) {
        try {
          const oldAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldAccountName })
            .getOne();
          if (oldAccount) {
            const currentBalance = parseFloat(oldAccount.balance || '0') || 0;
            const restoredBalance = (currentBalance - oldAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [restoredBalance, oldAccount.id]
            );
            console.log(`[updateCash] Restored account ${oldAccountName} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${oldAmount})`);
          }
        } catch (error) {
          console.error('[updateCash] Error restoring old account balance:', error);
        }
      }

      // Apply new account balance (add new amount)
      if (newAccountName && newAmount > 0) {
        try {
          const newAccount = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: newAccountName })
            .getOne();
          if (newAccount) {
            const currentBalance = parseFloat(newAccount.balance || '0') || 0;
            const newBalance = (currentBalance + newAmount).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, newAccount.id]
            );
            console.log(`[updateCash] Updated account ${newAccountName} balance: ${currentBalance} -> ${newBalance} (added ${newAmount})`);
          }
        } catch (error) {
          console.error('[updateCash] Error updating new account balance:', error);
        }
      } else if (oldAccountName === newAccountName && amountDifference !== 0) {
        // Same account, just amount changed - adjust by difference
        try {
          if (!oldAccountName) {
            throw new Error('oldAccountName is null');
          }
          const account = await this.accountsRepository
            .createQueryBuilder('account')
            .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: oldAccountName })
            .getOne();
          if (account) {
            const currentBalance = parseFloat(account.balance || '0') || 0;
            const newBalance = (currentBalance + amountDifference).toFixed(2);
            await this.accountsRepository.query(
              `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
              [newBalance, account.id]
            );
            console.log(`[updateCash] Adjusted account ${oldAccountName} balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('[updateCash] Error adjusting account balance:', error);
        }
      }
    }

    return updated;
  }

  async removeCash(id: string): Promise<void> {
    const collection = await this.collectionCashRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection cash with ID ${id} not found`);
    }

    // Restore account balance before deleting (subtract the collection amount)
    if (collection.accountName && collection.amount) {
      try {
        const account = await this.accountsRepository
          .createQueryBuilder('account')
          .where('LOWER(TRIM(account.account_name)) = LOWER(TRIM(:accountName))', { accountName: collection.accountName })
          .getOne();
        if (account) {
          const collectionAmount = parseFloat(collection.amount) || 0;
          const currentBalance = parseFloat(account.balance || '0') || 0;
          const restoredBalance = (currentBalance - collectionAmount).toFixed(2);
          await this.accountsRepository.query(
            `UPDATE public.accounts SET balance = $1 WHERE account_id = $2`,
            [restoredBalance, account.id]
          );
          console.log(`[removeCash] Restored account ${collection.accountName} balance: ${currentBalance} -> ${restoredBalance} (subtracted ${collectionAmount})`);
        }
      } catch (error) {
        console.error('[removeCash] Error restoring account balance:', error);
        // Continue with deletion even if balance update fails
      }
    }

    await this.collectionCashRepository.remove(collection);
  }
}


