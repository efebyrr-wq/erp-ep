import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumberString, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBillLineDto {
  @IsOptional()
  @IsString()
  type?: string | null;

  @IsOptional()
  @IsString()
  details?: string | null;

  @ValidateIf((o) => o.unitPrice !== null && o.unitPrice !== undefined && o.unitPrice !== '')
  @IsNumberString()
  unitPrice?: string | null;

  @ValidateIf((o) => o.amount !== null && o.amount !== undefined && o.amount !== '')
  @IsNumberString()
  amount?: string | null;

  @IsOptional()
  @IsString()
  operationId?: string | null;

  @ValidateIf((o) => o.startDate !== null && o.startDate !== undefined && o.startDate !== '')
  @IsDateString()
  startDate?: string | null;

  @ValidateIf((o) => o.endDate !== null && o.endDate !== undefined && o.endDate !== '')
  @IsDateString()
  endDate?: string | null;
}

export class CreateBillDto {
  @IsOptional()
  @IsString()
  customerName?: string | null;

  @ValidateIf((o) => o.totalAmount !== null && o.totalAmount !== undefined && o.totalAmount !== '')
  @IsNumberString()
  totalAmount?: string | null;

  @ValidateIf((o) => o.billDate !== null && o.billDate !== undefined && o.billDate !== '')
  @IsDateString()
  billDate?: string | null;

  @IsOptional()
  @IsBoolean()
  taxed?: boolean | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillLineDto)
  lines?: CreateBillLineDto[];
}

