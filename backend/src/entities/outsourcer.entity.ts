import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OutsourcerContactPerson } from './outsourcer-contact-person.entity';

@Entity({ name: 'outsourcers' })
export class Outsourcer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  balance!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @OneToMany(() => OutsourcerContactPerson, (contact) => contact.outsourcer)
  contacts!: OutsourcerContactPerson[];
}





