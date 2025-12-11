import { IsDateString, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCollectionCheckDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

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
}

