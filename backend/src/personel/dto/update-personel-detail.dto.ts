import { IsOptional, IsString } from 'class-validator';

export class UpdatePersonelDetailDto {
  @IsOptional()
  @IsString()
  detailName?: string;

  @IsOptional()
  @IsString()
  detailValue?: string;
}









