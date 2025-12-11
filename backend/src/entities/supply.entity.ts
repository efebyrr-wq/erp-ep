import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity({ name: 'supplies' })
export class Supply {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'supplier_id', type: 'bigint' })
  supplierId!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.supplies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ type: 'text' })
  type!: string;

  @Column({ name: 'product_name', type: 'text' })
  productName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}





