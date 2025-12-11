import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateWorkingSiteDto {
  @IsString()
  @IsNotEmpty()
  workingSiteName!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsOptional()
  @IsNumberString()
  latitude?: string | null;

  @IsOptional()
  @IsNumberString()
  longitude?: string | null;
}

