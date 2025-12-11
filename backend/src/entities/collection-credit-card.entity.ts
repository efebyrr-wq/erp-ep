import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'collection_credit_card' })
export class CollectionCreditCard {
  @PrimaryGeneratedColumn({ name: 'collection_credit_card_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  transactionDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'payment_to', type: 'text', nullable: true })
  paymentTo!: string | null;

  @Column({ name: 'credit_card_fee', type: 'numeric', nullable: true })
  creditCardFee!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}










