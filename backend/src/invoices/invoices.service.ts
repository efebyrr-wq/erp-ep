import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceLine, Supplier, OutsourceInvoiceLine, Outsourcer, OutsourceOperation } from '../entities';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private readonly invoiceLinesRepository: Repository<InvoiceLine>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    @InjectRepository(OutsourceInvoiceLine)
    private readonly outsourceInvoiceLinesRepository: Repository<OutsourceInvoiceLine>,
    @InjectRepository(Outsourcer)
    private readonly outsourcersRepository: Repository<Outsourcer>,
    @InjectRepository(OutsourceOperation)
    private readonly outsourceOperationsRepository: Repository<OutsourceOperation>,
  ) {}

  async findAll(): Promise<Invoice[]> {
    const invoices = await this.invoicesRepository.find({
      order: {
        billDate: 'DESC',
      },
    });
    
    // For each invoice, check if it has outsource lines and attach them
    for (const invoice of invoices) {
      try {
        const outsourceLines = await this.outsourceInvoiceLinesRepository.find({
          where: { billId: invoice.id },
        });
        if (outsourceLines.length > 0) {
          // Attach outsource lines to invoice (for display purposes)
          (invoice as any).outsourceLines = outsourceLines;
        }
      } catch (error) {
        // If table doesn't exist, just continue without outsource lines
        if (error instanceof Error && error.message.includes('does not exist')) {
          console.warn(`[findAll] outsource_invoice_lines table does not exist, skipping outsource lines for invoice ${invoice.id}`);
        }
      }
    }
    
    return invoices;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = this.invoicesRepository.create({
      supplierOutsourcerName: dto.supplierOutsourcerName,
      totalAmount: dto.totalAmount,
      billDate: dto.billDate,
      taxed: dto.taxed ?? false,
    });
    const saved = await this.invoicesRepository.save(invoice);
    
    // Check if this is for an outsourcer or supplier
    let isOutsourcer = false;
    if (dto.supplierOutsourcerName) {
      const outsourcerName = dto.supplierOutsourcerName.trim();
      console.log(`[createInvoice] Checking if "${outsourcerName}" is an outsourcer...`);
      const outsourcer = await this.outsourcersRepository
        .createQueryBuilder('outsourcer')
        .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: outsourcerName })
        .getOne();
      isOutsourcer = !!outsourcer;
      console.log(`[createInvoice] isOutsourcer = ${isOutsourcer} for name "${outsourcerName}"`);
      if (outsourcer) {
        console.log(`[createInvoice] Found outsourcer: ${outsourcer.name} (ID: ${outsourcer.id}, Balance: ${outsourcer.balance})`);
      }
    }

    if (dto.lines?.length) {
      if (isOutsourcer) {
        // Create outsource invoice lines
        const outsourceLines = await Promise.all(
          dto.lines.map(async (line) => {
            let outsourceOp: OutsourceOperation | null = null;
            if (line.operationId) {
              outsourceOp = await this.outsourceOperationsRepository.findOne({
                where: { id: line.operationId },
              });
            }

            // Use fields from DTO if provided, otherwise fall back to operation data
            return this.outsourceInvoiceLinesRepository.create({
              billId: saved.id,
              outsourceOperationId: line.operationId ?? null,
              outsourcerName: dto.supplierOutsourcerName,
              type: line.type ?? null,
              details: line.details ?? null,
              unitPrice: line.unitPrice ?? null,
              amount: line.amount ?? null,
              totalPrice: line.totalPrice ?? null,
            });
          }),
        );
        try {
          await this.outsourceInvoiceLinesRepository.save(outsourceLines);
          console.log(`[createInvoice] ✅ Created ${outsourceLines.length} outsource invoice line(s)`);
        } catch (error) {
          console.error('[createInvoice] ❌ Error saving outsource invoice lines:', error);
          if (error instanceof Error && error.message.includes('does not exist')) {
            throw new Error('The outsource_invoice_lines table does not exist. Please run the SQL in db/create-table-simple.sql to create it.');
          }
          throw error;
        }
      } else {
        // Create regular invoice lines for suppliers
      const lines = dto.lines.map((line) =>
        this.invoiceLinesRepository.create({
          billLineId: null,
          supplierOutsourcerName: line.supplierOutsourcerName ?? dto.supplierOutsourcerName,
          type: line.type ?? null,
          details: line.details ?? null,
          unitPrice: line.unitPrice ?? null,
          amount: line.amount ?? null,
          totalPrice: line.totalPrice ?? null,
            billId: saved.id,
          operationId: line.operationId ?? null,
        }),
      );
      await this.invoiceLinesRepository.save(lines);
    }
    }

    // Update supplier or outsourcer balance if supplierOutsourcerName is provided
    // Invoices INCREASE balance (money we owe them) - ADD the amount
    if (dto.supplierOutsourcerName && dto.totalAmount) {
      try {
        const name = dto.supplierOutsourcerName.trim();
        const invoiceAmount = parseFloat(dto.totalAmount) || 0;
        
        console.log(`[createInvoice] Balance update check - isOutsourcer: ${isOutsourcer}, name: "${name}", amount: ${invoiceAmount}`);
        
        if (invoiceAmount > 0) {
          if (isOutsourcer) {
            // Update outsourcer balance
            console.log(`[createInvoice] 🔄 Updating OUTSOURCER balance for "${name}" - ADDING ${invoiceAmount}`);
            
            let outsourcer = await this.outsourcersRepository
              .createQueryBuilder('outsourcer')
              .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name })
              .getOne();

            if (!outsourcer) {
              console.log(`[createInvoice] Query builder didn't find outsourcer, trying findOne with exact name...`);
              outsourcer = await this.outsourcersRepository.findOne({ where: { name } });
            }

            if (outsourcer) {
              const currentBalance = parseFloat(outsourcer.balance || '0') || 0;
              const newBalance = (currentBalance + invoiceAmount).toFixed(2);

              console.log(`[createInvoice] 📊 Outsourcer "${outsourcer.name}" (ID: ${outsourcer.id})`);
              console.log(`[createInvoice]    Current balance: ${currentBalance}`);
              console.log(`[createInvoice]    Invoice amount: ${invoiceAmount}`);
              console.log(`[createInvoice]    New balance: ${newBalance}`);

              outsourcer.balance = newBalance;
              const saved = await this.outsourcersRepository.save(outsourcer);
              console.log(`[createInvoice] 💾 Saved outsourcer with balance: ${saved.balance}`);

              // Verify the update
              const updatedOutsourcer = await this.outsourcersRepository.findOne({ where: { id: outsourcer.id } });
              const finalBalance = parseFloat(updatedOutsourcer?.balance || '0') || 0;
              
              console.log(`[createInvoice] ✅ VERIFIED: Outsourcer "${updatedOutsourcer?.name}" balance updated: ${currentBalance} -> ${finalBalance} (ADDED ${invoiceAmount} from invoice)`);
              
              if (Math.abs(finalBalance - parseFloat(newBalance)) > 0.01) {
                console.error(`[createInvoice] ⚠️ WARNING: Balance mismatch! Expected ${newBalance}, got ${finalBalance}`);
              }
            } else {
              console.error(`[createInvoice] ❌ Outsourcer not found with name: "${name}". Balance will not be updated.`);
              // List all outsourcers for debugging
              const allOutsourcers = await this.outsourcersRepository.find();
              console.log(`[createInvoice] Available outsourcers: ${allOutsourcers.map(o => `"${o.name}"`).join(', ')}`);
            }
          } else {
            // Update supplier balance
            console.log(`[createInvoice] Looking for supplier with name: "${name}" to ADD ${invoiceAmount} to balance`);
            
            let supplier = await this.suppliersRepository
              .createQueryBuilder('supplier')
              .where('LOWER(TRIM(supplier.name)) = LOWER(TRIM(:supplierName))', { supplierName: name })
              .getOne();

            if (!supplier) {
              supplier = await this.suppliersRepository.findOne({ where: { name } });
            }

            if (supplier) {
              const currentBalance = parseFloat(supplier.balance || '0') || 0;
              const newBalance = (currentBalance + invoiceAmount).toFixed(2);

              console.log(`[createInvoice] Found supplier "${supplier.name}" (ID: ${supplier.id}). Current balance: ${currentBalance}, Invoice amount: ${invoiceAmount}, New balance: ${newBalance}`);

              supplier.balance = newBalance;
              await this.suppliersRepository.save(supplier);

              const updatedSupplier = await this.suppliersRepository.findOne({ where: { id: supplier.id } });
              const finalBalance = parseFloat(updatedSupplier?.balance || '0') || 0;
              
              console.log(`[createInvoice] ✅ Updated supplier "${supplier.name}" balance: ${currentBalance} -> ${finalBalance} (ADDED ${invoiceAmount} from invoice)`);
            } else {
              console.error(`[createInvoice] ❌ Supplier not found with name: "${name}". Balance will not be updated.`);
            }
          }
        } else {
          console.log(`[createInvoice] Invoice amount is 0 or invalid: ${dto.totalAmount}`);
        }
      } catch (error) {
        console.error('[createInvoice] ❌ Error updating balance:', error);
        console.error('[createInvoice] Error details:', error instanceof Error ? error.stack : error);
        // Don't fail invoice creation if balance update fails
      }
    } else {
      console.log(`[createInvoice] Skipping supplier balance update - supplierOutsourcerName: ${dto.supplierOutsourcerName}, totalAmount: ${dto.totalAmount}`);
    }

    return saved;
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Store old values for balance calculation
    const oldAmount = invoice.totalAmount ? parseFloat(invoice.totalAmount) : 0;
    const oldSupplierName = invoice.supplierOutsourcerName;

    // Check if old invoice was for outsourcer
    let wasOutsourcer = false;
    if (oldSupplierName) {
      const oldOutsourcer = await this.outsourcersRepository
        .createQueryBuilder('outsourcer')
        .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: oldSupplierName.trim() })
        .getOne();
      wasOutsourcer = !!oldOutsourcer;
    }

    if (dto.supplierOutsourcerName !== undefined) invoice.supplierOutsourcerName = dto.supplierOutsourcerName;
    if (dto.totalAmount !== undefined) invoice.totalAmount = dto.totalAmount;
    if (dto.billDate !== undefined) invoice.billDate = dto.billDate;
    if (dto.taxed !== undefined) invoice.taxed = dto.taxed;
    const updated = await this.invoicesRepository.save(invoice);

    // Check if new invoice is for outsourcer
    let isOutsourcer = false;
    if (updated.supplierOutsourcerName) {
      const newOutsourcer = await this.outsourcersRepository
        .createQueryBuilder('outsourcer')
        .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: updated.supplierOutsourcerName.trim() })
        .getOne();
      isOutsourcer = !!newOutsourcer;
    }

    if (dto.lines) {
      // Delete existing lines (both types)
      const existingInvoiceLines = await this.invoiceLinesRepository.find({ where: { billId: id } });
      if (existingInvoiceLines.length) {
        await this.invoiceLinesRepository.remove(existingInvoiceLines);
      }
      const existingOutsourceLines = await this.outsourceInvoiceLinesRepository.find({ where: { billId: id } });
      if (existingOutsourceLines.length) {
        await this.outsourceInvoiceLinesRepository.remove(existingOutsourceLines);
      }

      // Create new lines based on type
      if (dto.lines.length) {
        if (isOutsourcer) {
          // Create outsource invoice lines
          const outsourceLines = await Promise.all(
            dto.lines.map(async (line) => {
              let outsourceOp: OutsourceOperation | null = null;
              if (line.operationId) {
                outsourceOp = await this.outsourceOperationsRepository.findOne({
                  where: { id: line.operationId },
                });
              }

              // Use fields from DTO if provided, otherwise fall back to operation data
              return this.outsourceInvoiceLinesRepository.create({
                billId: updated.id,
                outsourceOperationId: line.operationId ?? null,
                outsourcerName: updated.supplierOutsourcerName,
                type: line.type ?? null,
                details: line.details ?? null,
                unitPrice: line.unitPrice ?? null,
                amount: line.amount ?? null,
                totalPrice: line.totalPrice ?? null,
              });
            }),
          );
          await this.outsourceInvoiceLinesRepository.save(outsourceLines);
        } else {
          // Create regular invoice lines
        const lines = dto.lines.map((line) =>
          this.invoiceLinesRepository.create({
            billLineId: null,
            supplierOutsourcerName: line.supplierOutsourcerName ?? updated.supplierOutsourcerName,
            type: line.type ?? null,
            details: line.details ?? null,
            unitPrice: line.unitPrice ?? null,
            amount: line.amount ?? null,
            totalPrice: line.totalPrice ?? null,
              billId: updated.id,
            operationId: line.operationId ?? null,
          }),
        );
        await this.invoiceLinesRepository.save(lines);
      }
    }
    }

    // Update supplier/outsourcer balance: restore old amount, then add new amount
    const newAmount = dto.totalAmount ? parseFloat(dto.totalAmount) : 0;
    const newSupplierName = dto.supplierOutsourcerName !== undefined ? (dto.supplierOutsourcerName || null) : oldSupplierName;
    const amountDifference = newAmount - oldAmount;

    if (oldSupplierName || newSupplierName) {
      // Restore old balance (subtract old amount)
      if (oldSupplierName && oldAmount > 0) {
        try {
          if (wasOutsourcer) {
            const oldOutsourcer = await this.outsourcersRepository
              .createQueryBuilder('outsourcer')
              .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: oldSupplierName.trim() })
              .getOne();
            if (oldOutsourcer) {
              const currentBalance = parseFloat(oldOutsourcer.balance || '0') || 0;
              const restoredBalance = (currentBalance - oldAmount).toFixed(2);
              oldOutsourcer.balance = restoredBalance;
              await this.outsourcersRepository.save(oldOutsourcer);
              console.log(`[updateInvoice] Restored outsourcer "${oldOutsourcer.name}" balance: ${currentBalance} -> ${restoredBalance} (subtracted ${oldAmount})`);
            }
          } else {
            const oldSupplier = await this.suppliersRepository
              .createQueryBuilder('supplier')
              .where('LOWER(TRIM(supplier.name)) = LOWER(TRIM(:supplierName))', { supplierName: oldSupplierName })
              .getOne();
            if (oldSupplier) {
              const currentBalance = parseFloat(oldSupplier.balance || '0') || 0;
              const restoredBalance = (currentBalance - oldAmount).toFixed(2);
              oldSupplier.balance = restoredBalance;
              await this.suppliersRepository.save(oldSupplier);
              console.log(`[updateInvoice] Restored supplier "${oldSupplier.name}" balance: ${currentBalance} -> ${restoredBalance} (subtracted ${oldAmount})`);
            }
          }
        } catch (error) {
          console.error('[updateInvoice] Error restoring old balance:', error);
        }
      }

      // Apply new balance (add new amount)
      if (newSupplierName && newAmount > 0) {
        try {
          if (isOutsourcer) {
            const newOutsourcer = await this.outsourcersRepository
              .createQueryBuilder('outsourcer')
              .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: newSupplierName.trim() })
              .getOne();
            if (newOutsourcer) {
              const currentBalance = parseFloat(newOutsourcer.balance || '0') || 0;
              const newBalance = (currentBalance + newAmount).toFixed(2);
              newOutsourcer.balance = newBalance;
              await this.outsourcersRepository.save(newOutsourcer);
              console.log(`[updateInvoice] Updated outsourcer "${newOutsourcer.name}" balance: ${currentBalance} -> ${newBalance} (added ${newAmount})`);
            }
          } else {
            const newSupplier = await this.suppliersRepository
              .createQueryBuilder('supplier')
              .where('LOWER(TRIM(supplier.name)) = LOWER(TRIM(:supplierName))', { supplierName: newSupplierName })
              .getOne();
            if (newSupplier) {
              const currentBalance = parseFloat(newSupplier.balance || '0') || 0;
              const newBalance = (currentBalance + newAmount).toFixed(2);
              newSupplier.balance = newBalance;
              await this.suppliersRepository.save(newSupplier);
              console.log(`[updateInvoice] Updated supplier "${newSupplier.name}" balance: ${currentBalance} -> ${newBalance} (added ${newAmount})`);
            }
          }
        } catch (error) {
          console.error('[updateInvoice] Error updating new balance:', error);
        }
      } else if (oldSupplierName === newSupplierName && amountDifference !== 0 && !wasOutsourcer && !isOutsourcer) {
        // Same supplier, just amount changed - adjust by difference
        try {
          if (!oldSupplierName) {
            throw new Error('oldSupplierName is null');
          }
          const supplier = await this.suppliersRepository
            .createQueryBuilder('supplier')
            .where('LOWER(TRIM(supplier.name)) = LOWER(TRIM(:supplierName))', { supplierName: oldSupplierName })
            .getOne();
          if (supplier) {
            const currentBalance = parseFloat(supplier.balance || '0') || 0;
            const newBalance = (currentBalance + amountDifference).toFixed(2);
            supplier.balance = newBalance;
            await this.suppliersRepository.save(supplier);
            console.log(`[updateInvoice] Adjusted supplier "${supplier.name}" balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('[updateInvoice] Error adjusting supplier balance:', error);
        }
      } else if (oldSupplierName === newSupplierName && amountDifference !== 0 && wasOutsourcer && isOutsourcer) {
        // Same outsourcer, just amount changed - adjust by difference
        try {
          if (!oldSupplierName) {
            throw new Error('oldSupplierName is null');
          }
          const outsourcer = await this.outsourcersRepository
            .createQueryBuilder('outsourcer')
            .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: oldSupplierName.trim() })
            .getOne();
          if (outsourcer) {
            const currentBalance = parseFloat(outsourcer.balance || '0') || 0;
            const newBalance = (currentBalance + amountDifference).toFixed(2);
            outsourcer.balance = newBalance;
            await this.outsourcersRepository.save(outsourcer);
            console.log(`[updateInvoice] Adjusted outsourcer "${outsourcer.name}" balance by ${amountDifference}: ${currentBalance} -> ${newBalance}`);
          }
        } catch (error) {
          console.error('[updateInvoice] Error adjusting outsourcer balance:', error);
        }
      }
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Check if this is for an outsourcer or supplier
    let isOutsourcer = false;
    if (invoice.supplierOutsourcerName) {
      const outsourcerName = invoice.supplierOutsourcerName.trim();
      const outsourcer = await this.outsourcersRepository
        .createQueryBuilder('outsourcer')
        .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name: outsourcerName })
        .getOne();
      isOutsourcer = !!outsourcer;
    }

    // Delete invoice lines first (to avoid foreign key constraint violation)
    try {
      if (isOutsourcer) {
        // Delete outsource invoice lines
        const outsourceLines = await this.outsourceInvoiceLinesRepository.find({ where: { billId: id } });
        if (outsourceLines.length > 0) {
          await this.outsourceInvoiceLinesRepository.remove(outsourceLines);
          console.log(`[removeInvoice] Deleted ${outsourceLines.length} outsource invoice line(s) for invoice ${id}`);
        }
      } else {
        // Delete regular invoice lines
        const invoiceLines = await this.invoiceLinesRepository.find({ where: { billId: id } });
        if (invoiceLines.length > 0) {
          await this.invoiceLinesRepository.remove(invoiceLines);
          console.log(`[removeInvoice] Deleted ${invoiceLines.length} invoice line(s) for invoice ${id}`);
        }
        
        // Also delete rental invoice lines if they exist
        await this.invoiceLinesRepository.query(
          `DELETE FROM public.invoice_lines_rental WHERE bill_id = $1`,
          [id]
        );
      }
    } catch (error) {
      console.error('[removeInvoice] Error deleting invoice lines:', error);
      // Continue with invoice deletion even if line deletion fails
    }

    // Restore supplier or outsourcer balance before deleting invoice
    if (invoice.supplierOutsourcerName && invoice.totalAmount) {
      try {
        const invoiceAmount = parseFloat(invoice.totalAmount) || 0;
        if (invoiceAmount > 0) {
          const name = invoice.supplierOutsourcerName.trim();
          
          if (isOutsourcer) {
            // Restore outsourcer balance
            const outsourcer = await this.outsourcersRepository
              .createQueryBuilder('outsourcer')
              .where('LOWER(TRIM(outsourcer.name)) = LOWER(TRIM(:name))', { name })
              .getOne();
            
            if (outsourcer) {
              const currentBalance = parseFloat(outsourcer.balance || '0') || 0;
              const restoredBalance = (currentBalance - invoiceAmount).toFixed(2);
              outsourcer.balance = restoredBalance;
              await this.outsourcersRepository.save(outsourcer);
              const verified = await this.outsourcersRepository.findOne({ where: { id: outsourcer.id } });
              console.log(`[removeInvoice] Restored outsourcer "${outsourcer.name}" balance: ${currentBalance} -> ${verified?.balance} (subtracted ${invoiceAmount})`);
            }
          } else {
            // Restore supplier balance
            const supplier = await this.suppliersRepository
              .createQueryBuilder('supplier')
              .where('LOWER(TRIM(supplier.name)) = LOWER(TRIM(:supplierName))', { supplierName: name })
              .getOne();
            
            if (supplier) {
              const currentBalance = parseFloat(supplier.balance || '0') || 0;
              const restoredBalance = (currentBalance - invoiceAmount).toFixed(2);
              supplier.balance = restoredBalance;
              await this.suppliersRepository.save(supplier);
              const verified = await this.suppliersRepository.findOne({ where: { id: supplier.id } });
              console.log(`[removeInvoice] Restored supplier "${supplier.name}" balance: ${currentBalance} -> ${verified?.balance} (subtracted ${invoiceAmount})`);
            } else {
              // Try exact match as fallback
              const exactMatch = await this.suppliersRepository.findOne({ where: { name } });
              if (exactMatch) {
                const currentBalance = parseFloat(exactMatch.balance || '0') || 0;
                const restoredBalance = (currentBalance - invoiceAmount).toFixed(2);
                exactMatch.balance = restoredBalance;
                await this.suppliersRepository.save(exactMatch);
                console.log(`[removeInvoice] Restored supplier "${exactMatch.name}" balance: ${currentBalance} -> ${restoredBalance} (subtracted ${invoiceAmount})`);
              }
            }
          }
        }
      } catch (error) {
        console.error('[removeInvoice] Error restoring balance:', error);
        // Don't fail deletion if balance update fails
      }
    }

    // Now delete the invoice (lines are already deleted)
    await this.invoicesRepository.remove(invoice);
    console.log(`[removeInvoice] Successfully deleted invoice ${id}`);
  }
}


