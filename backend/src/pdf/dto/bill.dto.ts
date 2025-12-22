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
}

class BillItemDto {
  @IsString()
  @IsOptional()
  code?: string;

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
  vatRate?: string;

  @IsString()
  @IsOptional()
  vatAmount?: string;

  @IsString()
  @IsOptional()
  total?: string;
}

export class CreateBillDto {
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  from!: CompanyInfoDto;

  @ValidateNested()
  @Type(() => CompanyInfoDto)
  to!: CompanyInfoDto;

  @IsString()
  @IsNotEmpty()
  billNumber!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items!: BillItemDto[];

  @IsString()
  @IsOptional()
  subtotal?: string;

  @IsString()
  @IsOptional()
  vatTotal?: string;

  @IsString()
  @IsOptional()
  totalAmount?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}













