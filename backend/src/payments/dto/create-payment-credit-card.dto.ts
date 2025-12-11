import { IsDateString, IsInt, IsNumberString, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePaymentCreditCardDto {
  @IsString()
  @MinLength(1)
  collectorName!: string;

  @IsDateString()
  transactionDate!: string;

  @IsNumberString()
  amount!: string;

  @IsString()
  @MinLength(1)
  paymentFrom!: string;

  @IsOptional()
  @IsNumberString()
  creditCardFee?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Number of installments for this payment (e.g., 1 for single payment)
  @IsOptional()
  @IsInt()
  @Min(1)
  installmentPeriod?: number;

  @IsOptional()
  @IsString()
  customerName?: string;
}

