import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tax_payments' })
export class TaxPayment {
  @PrimaryGeneratedColumn({ name: 'tax_payment_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'tax_type', type: 'text', nullable: false })
  taxType!: string; // 'SGK Primleri', 'Kurumlar Vergisi', 'KDV'

  @Column({ type: 'numeric', nullable: false })
  amount!: string;

  @Column({ name: 'payment_date', type: 'date', nullable: false })
  paymentDate!: string;

  @Column({ name: 'account_id', type: 'bigint', nullable: false })
  accountId!: string;

  @Column({ name: 'account_name', type: 'text', nullable: true })
  accountName!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}






