import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PersonelDetail } from './personel-detail.entity';

@Entity({ name: 'personel' })
export class Personel {
  @PrimaryGeneratedColumn({ name: 'personel_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'personel_name', type: 'text' })
  personelName!: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'tc_kimlik', type: 'text', nullable: true })
  tcKimlik!: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ name: 'role', type: 'text', nullable: true })
  role!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @OneToMany(() => PersonelDetail, (detail) => detail.personel)
  details!: PersonelDetail[];
}

