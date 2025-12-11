import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'outsource_operations' })
export class OutsourceOperation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName!: string | null;

  @Column({ name: 'outsourcer_name', type: 'text', nullable: true })
  outsourcerName!: string | null;

  @Column({ name: 'machine_code', type: 'text', nullable: true })
  machineCode!: string | null;

  @Column({ name: 'working_site_name', type: 'text', nullable: true })
  workingSiteName!: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;
}





