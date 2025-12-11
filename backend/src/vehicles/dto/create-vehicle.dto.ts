import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsOptional()
  plateNumber?: string | null;

  @IsString()
  @IsOptional()
  vehicleType?: string | null;

  @IsDateString()
  @IsOptional()
  examinationDate?: string | null;

  @IsDateString()
  @IsOptional()
  insuranceDate?: string | null;
}





