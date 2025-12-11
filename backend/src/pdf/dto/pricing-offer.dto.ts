import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompanyInfoDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  vergiDairesi?: string;

  @IsString()
  @IsOptional()
  vkn?: string;

  @IsString()
  @IsOptional()
  logo?: string; // Base64 encoded image or URL
}

class PricingOfferItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  quantity?: string;

  @IsString()
  @IsOptional()
  unitPrice?: string;

  @IsString()
  @IsOptional()
  total?: string;
}

export class CreatePricingOfferDto {
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  from!: CompanyInfoDto;

  @ValidateNested()
  @Type(() => CompanyInfoDto)
  to!: CompanyInfoDto;

  @IsString()
  @IsNotEmpty()
  offerNumber!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsOptional()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingOfferItemDto)
  items!: PricingOfferItemDto[];

  @IsString()
  @IsOptional()
  totalAmount?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

