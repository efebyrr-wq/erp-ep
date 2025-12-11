import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Outsourcer } from './outsourcer.entity';

@Entity({ name: 'outsourcer_contact_persons' })
export class OutsourcerContactPerson {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'outsourcer_id', type: 'bigint' })
  outsourcerId!: string;

  @ManyToOne(() => Outsourcer, (outsourcer) => outsourcer.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outsourcer_id' })
  outsourcer!: Outsourcer;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  role!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'phone_number', type: 'text', nullable: true })
  phoneNumber!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}





