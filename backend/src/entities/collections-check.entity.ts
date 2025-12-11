import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'collections_check' })
export class CollectionsCheck {
  @PrimaryGeneratedColumn({ name: 'collection_check_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'check_date', type: 'date', nullable: true })
  checkDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'collection_date', type: 'date', nullable: true })
  collectionDate!: string | null;

  @Column({ name: 'account_name', type: 'text', nullable: true })
  accountName!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}










