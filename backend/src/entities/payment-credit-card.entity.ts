import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'payment_credit_card' })
export class PaymentCreditCard {
  @PrimaryGeneratedColumn({ name: 'payment_credit_card_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'collector_name', type: 'text', nullable: true })
  collectorName!: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  transactionDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'payment_from', type: 'text', nullable: true })
  paymentFrom!: string | null;

  @Column({ name: 'credit_card_fee', type: 'numeric', nullable: true })
  creditCardFee!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'installment_period', type: 'int', nullable: true })
  installmentPeriod!: number | null;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;
}


