import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'internal_operations' })
export class InternalOperation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'machine_number', type: 'text', nullable: true })
  machineNumber!: string | null;

  @Column({ name: 'machine_code', type: 'text', nullable: true })
  machineCode!: string | null;

  @Column({ name: 'working_site_name', type: 'text', nullable: true })
  workingSiteName!: string | null;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate!: string | null;
}





