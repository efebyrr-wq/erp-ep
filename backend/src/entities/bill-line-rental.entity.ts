import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bill } from './bill.entity';

@Entity({ name: 'bill_lines_rental' })
export class BillLineRental {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'bill_line_id', type: 'bigint', nullable: true })
  billLineId!: string | null;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ type: 'text', nullable: true })
  type!: string | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ name: 'unit_price', type: 'numeric', nullable: true })
  unitPrice!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'total_price', type: 'numeric', nullable: true })
  totalPrice!: string | null;

  @Column({ name: 'bill_id', type: 'bigint', nullable: true })
  billId!: string | null;

  @Column({ name: 'operation_id', type: 'bigint', nullable: true })
  operationId!: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @ManyToOne(() => Bill, (bill) => bill.billLines)
  bill!: Bill;
}










