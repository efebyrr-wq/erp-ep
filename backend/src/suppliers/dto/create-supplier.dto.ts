import {
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SupplierContactDto {
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

class SupplyDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @MinLength(1)
  productName!: string;

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  price!: string;
}

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsNumberString()
  balance?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierContactDto)
  contacts?: SupplierContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplyDto)
  supplies?: SupplyDto[];
}














