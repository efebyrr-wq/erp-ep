import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCollectionCashDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

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
}

