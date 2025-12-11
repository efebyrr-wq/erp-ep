import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supply } from './supply.entity';
import { SupplierContactPerson } from './supplier-contact-person.entity';

@Entity({ name: 'suppliers' })
export class Supplier {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  balance!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @OneToMany(() => Supply, (supply) => supply.supplier)
  supplies!: Supply[];

  @OneToMany(() => SupplierContactPerson, (contact) => contact.supplier)
  contacts!: SupplierContactPerson[];
}





