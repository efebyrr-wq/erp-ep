import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCollectionCashDto {
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
  accountName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

