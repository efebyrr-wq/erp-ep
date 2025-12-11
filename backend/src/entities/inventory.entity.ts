import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'inventory' })
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'item_name', type: 'text' })
  itemName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'reference_bill_id', type: 'bigint', nullable: true })
  referenceBillId!: string | null;

  @Column({ name: 'used_at', type: 'date', nullable: true })
  usedAt!: string | null;
}





