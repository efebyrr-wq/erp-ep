import { IsInt, IsNumberString, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  accountName!: string;

  @IsString()
  @MinLength(1)
  type!: string;

  @IsOptional()
  @IsNumberString()
  balance?: string;

  // Cut-off day for Credit Card accounts, null otherwise
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  cutoffDay?: number;
}

