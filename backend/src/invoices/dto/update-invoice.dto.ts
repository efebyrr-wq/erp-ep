import { IsArray, IsBoolean, IsDateString, IsNumberString, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
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

  // Outsource invoice line fields
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  machineCode?: string;

  @IsOptional()
  @IsString()
  workingSiteName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  supplierOutsourcerName?: string;

  @IsOptional()
  @IsNumberString()
  totalAmount?: string;

  @IsOptional()
  @IsDateString()
  billDate?: string;

  @IsOptional()
  @IsBoolean()
  taxed?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines?: InvoiceLineInputDto[];
}


