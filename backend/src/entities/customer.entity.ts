import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactPerson } from './contact-person.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'phone_number', type: 'text', nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'vergi_dairesi', type: 'text', nullable: true })
  vergiDairesi!: string | null;

  @Column({ name: 'vkn', type: 'text', nullable: true })
  vkn!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @OneToMany(() => ContactPerson, (contact) => contact.customer)
  contacts!: ContactPerson[];
}




