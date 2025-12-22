import { IsString, IsNotEmpty, IsNumberString, IsDateString, IsOptional } from 'class-validator';

export class CreateTaxPaymentDto {
  @IsString()
  @IsNotEmpty()
  taxType!: string; // 'SGK Primleri', 'Kurumlar Vergisi', 'KDV'

  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @IsDateString()
  @IsNotEmpty()
  paymentDate!: string;

  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @IsString()
  @IsOptional()
  accountName?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}









