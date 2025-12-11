import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'plate_number', type: 'text', nullable: true })
  plateNumber!: string | null;

  @Column({ name: 'vehicle_type', type: 'text', nullable: true })
  vehicleType!: string | null;

  @Column({ name: 'examination_date', type: 'date', nullable: true })
  examinationDate!: string | null;

  @Column({ name: 'insurance_date', type: 'date', nullable: true })
  insuranceDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}





