import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bill, Customer } from '../entities';
import { CreateBillDto } from './dto/create-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Bill[]> {
    try {
      const bills = await this.billsRepository.find({
        relations: ['billLines'],
        order: {
          billDate: 'DESC',
        },
      });

      // Fetch rental lines for all bills and merge them
      const billIds = bills.map(b => b.id);
      if (billIds.length > 0) {
        const rentalResults = await this.dataSource.query(
          `SELECT * FROM bill_lines_rental WHERE bill_id = ANY($1::bigint[])`,
          [billIds]
        );

        // Group rental lines by bill_id
        const rentalLinesByBillId = new Map<string, any[]>();
        rentalResults.forEach((row: any) => {
          const billId = String(row.bill_id);
          if (!rentalLinesByBillId.has(billId)) {
            rentalLinesByBillId.set(billId, []);
          }
          rentalLinesByBillId.get(billId)!.push({
            id: String(row.id),
            billLineId: row.bill_line_id ? String(row.bill_line_id) : null,
            customerName: row.customer_name,
            type: row.type,
            details: row.details,
            unitPrice: row.unit_price ? String(row.unit_price) : null,
            amount: row.amount ? String(row.amount) : null,
            totalPrice: row.total_price ? String(row.total_price) : null,
            billId: billId,
            operationId: row.operation_id ? String(row.operation_id) : null,
            startDate: row.start_date,
            endDate: row.end_date,
          });
        });

        // Merge rental lines with regular bill lines
        return bills.map(bill => ({
          ...bill,
          billLines: [
            ...(bill.billLines || []),
            ...(rentalLinesByBillId.get(bill.id) || [])
          ],
        }));
      }

      return bills;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Bill | null> {
    try {
      const bill = await this.billsRepository.findOne({
        where: { id },
        relations: ['billLines'],
      });
      
      if (!bill) {
        return null;
      }

      // Fetch rental lines and merge with regular bill lines
      let rentalLines: any[] = [];
      try {
        const rentalResults = await this.dataSource.query(
          'SELECT * FROM bill_lines_rental WHERE bill_id = $1',
          [id]
        );
        rentalLines = rentalResults.map((row: any) => ({
          id: String(row.id),
          billLineId: row.bill_line_id ? String(row.bill_line_id) : null,
          customerName: row.customer_name,
          type: row.type,
          details: row.details,
          unitPrice: row.unit_price ? String(row.unit_price) : null,
          amount: row.amount ? String(row.amount) : null,
          totalPrice: row.total_price ? String(row.total_price) : null,
          billId: row.bill_id ? String(row.bill_id) : null,
          operationId: row.operation_id ? String(row.operation_id) : null,
          startDate: row.start_date,
          endDate: row.end_date,
        }));
      } catch (error) {
        console.error('Error fetching rental lines (continuing without them):', error);
        // Continue without rental lines if there's an error
      }

      // Merge rental lines with regular bill lines into a single billLines array
      return {
        ...bill,
        billLines: [
          ...(bill.billLines || []),
          ...rentalLines
        ],
      };
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    // Normalize empty strings to null
    const normalize = (value: string | null | undefined): string | null => {
      if (value === undefined || value === null || value === '') return null;
      return value.trim() || null;
    };

    // Calculate total amount from lines if not provided
    let totalAmount = createBillDto.totalAmount;
    if (!totalAmount && createBillDto.lines && createBillDto.lines.length > 0) {
      const calculatedTotal = createBillDto.lines.reduce((sum, line) => {
        const unitPrice = parseFloat(line.unitPrice || '0') || 0;
        const amount = parseFloat(line.amount || '0') || 0;
        return sum + (unitPrice * amount);
      }, 0);
      totalAmount = calculatedTotal.toFixed(2);
    }

    // Insert bill using raw SQL to avoid TypeORM issues
    const billResult = await this.billsRepository.query(
      `INSERT INTO public.bills (customer_name, total_amount, bill_date, taxed)
       VALUES ($1, $2, $3, $4)
       RETURNING id, customer_name as "customerName", total_amount as "totalAmount",
                 bill_date as "billDate", taxed`,
      [
        normalize(createBillDto.customerName),
        normalize(totalAmount),
        normalize(createBillDto.billDate),
        createBillDto.taxed ?? false,
      ]
    );

    if (!billResult || billResult.length === 0) {
      throw new Error('Failed to create bill');
    }

    const bill = billResult[0];
    const billId = bill.id;

    // Save bill lines
    if (createBillDto.lines && createBillDto.lines.length > 0) {
      // Separate rental and non-rental lines
      const rentalLines = createBillDto.lines.filter((line) => {
        const type = (line.type || '').toLowerCase();
        return type.includes('rental');
      });
      const nonRentalLines = createBillDto.lines.filter((line) => {
        const type = (line.type || '').toLowerCase();
        return !type.includes('rental');
      });

      // Insert non-rental bill lines
      for (const line of nonRentalLines) {
        const unitPrice = parseFloat(line.unitPrice || '0') || 0;
        const amount = parseFloat(line.amount || '0') || 0;
        const totalPrice = (unitPrice * amount).toFixed(2);

        await this.dataSource.query(
          `INSERT INTO public.bill_lines 
           (customer_name, type, details, unit_price, amount, total_price, bill_id, operation_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            normalize(createBillDto.customerName),
            normalize(line.type),
            normalize(line.details),
            normalize(line.unitPrice),
            normalize(line.amount),
            totalPrice,
            billId,
            normalize(line.operationId),
          ]
        );
      }

      // Insert rental bill lines
      for (const line of rentalLines) {
        const unitPrice = parseFloat(line.unitPrice || '0') || 0;
        const amount = parseFloat(line.amount || '0') || 0;
        const totalPrice = (unitPrice * amount).toFixed(2);

        await this.dataSource.query(
          `INSERT INTO public.bill_lines_rental 
           (customer_name, type, details, unit_price, amount, total_price, bill_id, operation_id, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            normalize(createBillDto.customerName),
            normalize(line.type),
            normalize(line.details),
            normalize(line.unitPrice),
            normalize(line.amount),
            totalPrice,
            billId,
            normalize(line.operationId),
            normalize(line.startDate),
            normalize(line.endDate),
          ]
        );
      }
    }

    // Update customer balance by subtracting the bill amount
    if (createBillDto.customerName && totalAmount) {
      try {
        const customer = await this.customersRepository.findOne({
          where: { name: createBillDto.customerName },
        });

        if (customer) {
          const currentBalance = parseFloat(customer.balance || '0') || 0;
          const billAmount = parseFloat(totalAmount) || 0;
          const newBalance = (currentBalance - billAmount).toFixed(2);

          await this.customersRepository.query(
            `UPDATE public.customers SET balance = $1 WHERE id = $2`,
            [newBalance, customer.id]
          );

          console.log(`Updated customer ${createBillDto.customerName} balance: ${currentBalance} -> ${newBalance} (subtracted ${billAmount})`);
        } else {
          console.warn(`Customer not found: ${createBillDto.customerName}`);
        }
      } catch (error) {
        console.error('Error updating customer balance:', error);
        // Don't fail bill creation if balance update fails
      }
    }

    // Return the created bill with lines
    const createdBill = await this.findOne(billId);
    if (!createdBill) {
      throw new Error(`Failed to retrieve created bill with id ${billId}`);
    }
    return createdBill;
  }

  async remove(id: string): Promise<void> {
    // First, get the bill to restore customer balance
    const bill = await this.findOne(id);
    if (!bill) {
      throw new Error(`Bill with id ${id} not found`);
    }

    // Restore customer balance by adding back the bill amount
    if (bill.customerName && bill.totalAmount) {
      try {
        const customer = await this.customersRepository.findOne({
          where: { name: bill.customerName },
        });

        if (customer) {
          const currentBalance = parseFloat(customer.balance || '0') || 0;
          const billAmount = parseFloat(bill.totalAmount) || 0;
          const newBalance = (currentBalance + billAmount).toFixed(2);

          await this.customersRepository.query(
            `UPDATE public.customers SET balance = $1 WHERE id = $2`,
            [newBalance, customer.id]
          );

          console.log(`Restored customer ${bill.customerName} balance: ${currentBalance} -> ${newBalance} (added back ${billAmount})`);
        } else {
          console.warn(`Customer not found: ${bill.customerName}`);
        }
      } catch (error) {
        console.error('Error restoring customer balance:', error);
        // Continue with deletion even if balance update fails
      }
    }

    // Delete rental bill lines first (foreign key constraint)
    await this.dataSource.query(
      `DELETE FROM public.bill_lines_rental WHERE bill_id = $1`,
      [id]
    );

    // Delete regular bill lines
    await this.dataSource.query(
      `DELETE FROM public.bill_lines WHERE bill_id = $1`,
      [id]
    );

    // Delete the bill
    await this.billsRepository.query(
      `DELETE FROM public.bills WHERE id = $1`,
      [id]
    );
  }
}


