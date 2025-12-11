import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity({ name: 'invoice_lines' })
export class InvoiceLine {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'bill_line_id', type: 'bigint', nullable: true })
  billLineId!: string | null;

  @Column({ name: 'supplier_outsourcer_name', type: 'text', nullable: true })
  supplierOutsourcerName!: string | null;

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

  @ManyToOne(() => Invoice, (invoice) => invoice.invoiceLines)
  @JoinColumn({ name: 'bill_id' })
  invoice!: Invoice;
}

