import { IsIn, IsNumberString, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageBundleItem } from './create-operation-details.dto';

export class UpdateOperationDetailsDto {
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



