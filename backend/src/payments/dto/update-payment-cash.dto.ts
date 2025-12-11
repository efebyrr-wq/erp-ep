import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePaymentCashDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  collectorName?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  accountName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}

