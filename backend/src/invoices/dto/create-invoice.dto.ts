import { IsBoolean, IsDateString, IsNumberString, IsOptional, IsString, MinLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceLineInputDto {
  @IsOptional()
  @IsString()
  supplierOutsourcerName?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsNumberString()
  totalPrice?: string;

  @IsOptional()
  @IsString()
  operationId?: string;
}

export class CreateInvoiceDto {
  @IsString()
  @MinLength(1)
  supplierOutsourcerName!: string;

  @IsNumberString()
  totalAmount!: string;

  @IsDateString()
  billDate!: string;

  @IsOptional()
  @IsBoolean()
  taxed?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines?: InvoiceLineInputDto[];
}


