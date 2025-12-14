import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Personel } from './personel.entity';

@Entity({ name: 'personel_details' })
export class PersonelDetail {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'personel_id', type: 'bigint' })
  personelId!: string;

  @ManyToOne(() => Personel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personel_id' })
  personel!: Personel;

  @Column({ name: 'detail_name', type: 'text' })
  detailName!: string;

  @Column({ name: 'detail_value', type: 'text' })
  detailValue!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}







