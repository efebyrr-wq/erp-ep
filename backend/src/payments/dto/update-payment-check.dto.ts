import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePaymentCheckDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  collectorName?: string;

  @IsOptional()
  @IsDateString()
  checkDate?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsDateString()
  collectionDate?: string;

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

