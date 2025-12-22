import {
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OutsourcerContactDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  role?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  phoneNumber?: string | null;
}

export class CreateOutsourcerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsNumberString()
  balance?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutsourcerContactDto)
  contacts?: OutsourcerContactDto[];
}














