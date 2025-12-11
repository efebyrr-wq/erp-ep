import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePaymentCashDto {
  @IsString()
  @MinLength(1)
  collectorName!: string;

  @IsDateString()
  transactionDate!: string;

  @IsNumberString()
  amount!: string;

  @IsString()
  @MinLength(1)
  accountName!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}

