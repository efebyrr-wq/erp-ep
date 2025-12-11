import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'payments_check' })
export class PaymentsCheck {
  @PrimaryGeneratedColumn({ name: 'payment_check_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'collector_name', type: 'text', nullable: true })
  collectorName!: string | null;

  @Column({ name: 'check_date', type: 'date', nullable: true })
  checkDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'collection_date', type: 'date', nullable: true })
  collectionDate!: string | null;

  @Column({ name: 'account_name', type: 'text', nullable: true })
  accountName!: string | null;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}






