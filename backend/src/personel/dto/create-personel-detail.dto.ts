import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePersonelDetailDto {
  @IsNotEmpty()
  @IsString()
  personelId!: string;

  @IsNotEmpty()
  @IsString()
  detailName!: string;

  @IsNotEmpty()
  @IsString()
  detailValue!: string;
}






