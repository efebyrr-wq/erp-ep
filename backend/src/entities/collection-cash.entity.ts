import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'collection_cash' })
export class CollectionCash {
  @PrimaryGeneratedColumn({ name: 'collection_cash_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  transactionDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'account_name', type: 'text', nullable: true })
  accountName!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}










