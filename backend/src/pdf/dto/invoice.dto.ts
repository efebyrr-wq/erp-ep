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
  phone2?: string;

  @IsString()
  @IsOptional()
  website?: string;

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

class InvoiceItemDto {
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

class BankAccountDto {
  @IsString()
  @IsOptional()
  bank?: string;

  @IsString()
  @IsOptional()
  accountHolder?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  iban?: string;
}

export class CreateInvoiceDto {
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  from!: CompanyInfoDto;

  @ValidateNested()
  @Type(() => CompanyInfoDto)
  to!: CompanyInfoDto;

  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  subtotal?: string;

  @IsString()
  @IsOptional()
  vatTotal?: string;

  @IsString()
  @IsOptional()
  totalAmount?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankAccountDto)
  @IsOptional()
  bankAccounts?: BankAccountDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  ettn?: string;

  @IsString()
  @IsOptional()
  customizationNumber?: string;

  @IsString()
  @IsOptional()
  scenario?: string;

  @IsString()
  @IsOptional()
  invoiceType?: string;

  @IsString()
  @IsOptional()
  vatRate?: string;
}

