import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePaymentCheckDto {
  @IsString()
  @MinLength(1)
  collectorName!: string;

  @IsDateString()
  checkDate!: string;

  @IsNumberString()
  amount!: string;

  @IsDateString()
  collectionDate!: string;

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

