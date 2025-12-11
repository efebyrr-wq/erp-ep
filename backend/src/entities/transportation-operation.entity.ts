import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'transportation_operations' })
export class TransportationOperation {
  @PrimaryGeneratedColumn({
    name: 'transportation_op_id',
    type: 'bigint',
  })
  transportationOpId!: string;

  @Column({ name: 'plate_num', type: 'text', nullable: true })
  plateNum!: string | null;

  @Column({ name: 'starting_loc', type: 'text', nullable: true })
  startingLoc!: string | null;

  @Column({ name: 'ending_loc', type: 'text', nullable: true })
  endingLoc!: string | null;

  @Column({ name: 'date', type: 'date', nullable: true })
  operationDate!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}




