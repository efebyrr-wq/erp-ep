import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BillLine } from './bill-line.entity';

@Entity({ name: 'bills' })
export class Bill {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'total_amount', type: 'numeric', nullable: true })
  totalAmount!: string | null;

  @Column({ type: 'text', nullable: true })
  lines!: string | null;

  @Column({ name: 'bill_date', type: 'date', nullable: true })
  billDate!: string | null;

  @Column({ type: 'boolean', nullable: true })
  taxed!: boolean | null;

  @OneToMany(() => BillLine, (line) => line.bill)
  billLines!: BillLine[];
}





