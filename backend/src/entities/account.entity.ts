import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn({ name: 'account_id', type: 'bigint' })
  id!: string;

  @Column({ type: 'text', nullable: true })
  type!: string | null;

  @Column({ name: 'account_name', type: 'text', nullable: true })
  accountName!: string | null;

  @Column({ type: 'numeric', nullable: true })
  balance!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  // For credit card accounts only: day of month when the cut-off is applied (1-31)
  @Column({ name: 'cutoff_day', type: 'int', nullable: true })
  cutoffDay!: number | null;
}


