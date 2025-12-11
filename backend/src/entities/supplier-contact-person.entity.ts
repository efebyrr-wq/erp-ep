import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity({ name: 'supplier_contact_persons' })
export class SupplierContactPerson {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'supplier_id', type: 'bigint' })
  supplierId!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

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





