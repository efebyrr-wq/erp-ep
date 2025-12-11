import {
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ContactPersonDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  role!: string;

  @IsString()
  @MinLength(3)
  email!: string;

  @IsString()
  @MinLength(3)
  phoneNumber!: string;
}

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsNumberString()
  balance?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  vergiDairesi?: string | null;

  @IsOptional()
  @IsString()
  vkn?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactPersonDto)
  contacts?: ContactPersonDto[];
}




