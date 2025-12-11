import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'working_sites' })
export class WorkingSite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'working_site_name', type: 'text' })
  workingSiteName!: string;

  @Column({ type: 'text' })
  location!: string;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}




