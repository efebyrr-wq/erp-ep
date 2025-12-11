import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransportationOperation } from './transportation-operation.entity';

@Entity({ name: 'operations_details' })
export class OperationDetails {
  @PrimaryColumn({ name: 'operation_id', type: 'bigint' })
  operationId!: string;

  @Column({ name: 'operation_type', type: 'text' })
  operationType!: string; // 'internal', 'outsource', 'service', 'transportation'

  @Column({ name: 'delivery_transportation', type: 'bigint', nullable: true })
  deliveryTransportation!: string | null;

  @ManyToOne(() => TransportationOperation, { nullable: true })
  @JoinColumn({ name: 'delivery_transportation', referencedColumnName: 'transportationOpId' })
  deliveryTransportationOp?: TransportationOperation;

  @Column({ name: 'pickup_transportation', type: 'bigint', nullable: true })
  pickupTransportation!: string | null;

  @ManyToOne(() => TransportationOperation, { nullable: true })
  @JoinColumn({ name: 'pickup_transportation', referencedColumnName: 'transportationOpId' })
  pickupTransportationOp?: TransportationOperation;

  // Legacy text columns (kept for backward compatibility)
  @Column({ name: 'pricing_proposal', type: 'text', nullable: true })
  pricingProposal!: string | null; // PDF file path/URL (legacy)

  @Column({ name: 'image_delivery', type: 'text', nullable: true })
  imageDelivery!: string | null; // Image file path/URL (legacy)

  @Column({ name: 'image_pickup', type: 'text', nullable: true })
  imagePickup!: string | null; // Image file path/URL (legacy)

  @Column({ name: 'invoice_operation', type: 'text', nullable: true })
  invoiceOperation!: string | null; // Invoice information (legacy)

  // Binary data columns
  @Column({ name: 'pricing_proposal_pdf', type: 'bytea', nullable: true })
  pricingProposalPdf!: Buffer | null; // PDF binary data

  @Column({ name: 'invoice_pdf', type: 'bytea', nullable: true })
  invoicePdf!: Buffer | null; // Invoice PDF binary data

  @Column({ name: 'image_delivery_bundle', type: 'jsonb', nullable: true })
  imageDeliveryBundle!: Array<{ data: string; mimeType: string; filename?: string }> | null; // Array of base64 images

  @Column({ name: 'image_pickup_bundle', type: 'jsonb', nullable: true })
  imagePickupBundle!: Array<{ data: string; mimeType: string; filename?: string }> | null; // Array of base64 images

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}



