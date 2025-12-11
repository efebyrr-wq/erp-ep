import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MachinerySpec } from './machinery-spec.entity';

@Entity({ name: 'machinery' })
export class Machinery {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'machine_number', type: 'text' })
  machineNumber!: string;

  @Column({ name: 'machine_code', type: 'text' })
  machineCode!: string;

  @Column({ type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @OneToMany(() => MachinerySpec, (spec) => spec.machinery)
  specs!: MachinerySpec[];
}





