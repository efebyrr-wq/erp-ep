import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { OutsourceOperation } from './outsource-operation.entity';

@Entity({ name: 'outsource_invoice_lines' })
export class OutsourceInvoiceLine {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'bill_id', type: 'bigint', nullable: true })
  billId!: string | null;

  @Column({ name: 'outsource_operation_id', type: 'bigint', nullable: true })
  outsourceOperationId!: string | null;

  @Column({ name: 'outsourcer_name', type: 'text', nullable: true })
  outsourcerName!: string | null;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  invoice!: Invoice;

  @ManyToOne(() => OutsourceOperation, { nullable: true })
  @JoinColumn({ name: 'outsource_operation_id' })
  outsourceOperation!: OutsourceOperation | null;
}












