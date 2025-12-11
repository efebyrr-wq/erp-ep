import { IsInt, IsNumberString, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @IsOptional()
  @IsNumberString()
  balance?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  cutoffDay?: number;
}

