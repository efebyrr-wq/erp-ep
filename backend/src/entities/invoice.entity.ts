import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceLine } from './invoice-line.entity';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'supplier_outsourcer_name', type: 'text', nullable: true })
  supplierOutsourcerName!: string | null;

  @Column({ name: 'total_amount', type: 'numeric', nullable: true })
  totalAmount!: string | null;

  @Column({ type: 'text', nullable: true })
  lines!: string | null;

  @Column({ name: 'bill_date', type: 'date', nullable: true })
  billDate!: string | null;

  @Column({ type: 'boolean', nullable: true })
  taxed!: boolean | null;

  @OneToMany(() => InvoiceLine, (line) => line.invoice)
  invoiceLines!: InvoiceLine[];
}










