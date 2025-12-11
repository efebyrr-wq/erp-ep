import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreatePersonelPaymentDto {
  @IsString()
  personelName!: string;

  @IsOptional()
  @IsString()
  paymentAccount?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

