import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity({ name: 'contact_persons' })
export class ContactPerson {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  role!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ name: 'phone_number', type: 'text' })
  phoneNumber!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}





