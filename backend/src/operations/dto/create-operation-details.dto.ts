import { IsIn, IsNumberString, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageBundleItem {
  @IsString()
  data!: string; // base64 encoded image data

  @IsString()
  mimeType!: string; // e.g., 'image/jpeg', 'image/png'

  @IsOptional()
  @IsString()
  filename?: string;
}

export class CreateOperationDetailsDto {
  @IsNumberString()
  operationId!: string;

  @IsString()
  @IsIn(['internal', 'outsource', 'service', 'transportation'])
  operationType!: string;

  @IsOptional()
  @IsNumberString()
  deliveryTransportation?: string | null;

  @IsOptional()
  @IsNumberString()
  pickupTransportation?: string | null;

  // Binary data fields
  @IsOptional()
  @IsString()
  pricingProposalPdf?: string | null; // base64 encoded PDF

  @IsOptional()
  @IsString()
  invoicePdf?: string | null; // base64 encoded PDF

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageBundleItem)
  imageDeliveryBundle?: ImageBundleItem[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageBundleItem)
  imagePickupBundle?: ImageBundleItem[] | null;
}



