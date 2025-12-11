import { IsDateString, IsInt, IsNumberString, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdatePaymentCreditCardDto {
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
  paymentFrom?: string;

  @IsOptional()
  @IsNumberString()
  creditCardFee?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  installmentPeriod?: number;

  @IsOptional()
  @IsString()
  customerName?: string;
}

