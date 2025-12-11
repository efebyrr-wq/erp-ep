import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Machinery } from './machinery.entity';

@Entity({ name: 'machinery_specs' })
export class MachinerySpec {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'machinery_id', type: 'bigint' })
  machineryId!: string;

  @ManyToOne(() => Machinery, (machinery) => machinery.specs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machinery_id' })
  machinery!: Machinery;

  @Column({ name: 'spec_name', type: 'text' })
  specName!: string;

  @Column({ name: 'spec_value', type: 'text' })
  specValue!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}





