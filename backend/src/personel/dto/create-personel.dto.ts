import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePersonelDto {
  @IsString()
  personelName!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  tcKimlik?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

