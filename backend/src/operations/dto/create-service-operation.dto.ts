import { IsOptional, IsString } from 'class-validator';

export class CreateServiceOperationDto {
  @IsString()
  @IsOptional()
  machineNumber?: string | null;

  @IsString()
  @IsOptional()
  type?: string | null;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  usedParts?: string | null;
}





