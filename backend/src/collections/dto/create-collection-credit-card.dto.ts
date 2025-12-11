import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCollectionCreditCardDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsDateString()
  transactionDate!: string;

  @IsNumberString()
  amount!: string;

  @IsString()
  @MinLength(1)
  paymentTo!: string;

  @IsOptional()
  @IsNumberString()
  creditCardFee?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

