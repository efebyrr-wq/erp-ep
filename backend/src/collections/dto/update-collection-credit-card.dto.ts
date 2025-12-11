import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCollectionCreditCardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  customerName?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  paymentTo?: string;

  @IsOptional()
  @IsNumberString()
  creditCardFee?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

