import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'personel_payments' })
export class PersonelPayment {
  @PrimaryGeneratedColumn({ name: 'personel_payment_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'personel_name', type: 'text' })
  personelName!: string;

  @Column({ name: 'payment_account', type: 'text', nullable: true })
  paymentAccount!: string | null;

  @Column({ name: 'amount', type: 'numeric', nullable: true })
  amount!: string | null;

  @Column({ name: 'date', type: 'date', nullable: true })
  date!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}

