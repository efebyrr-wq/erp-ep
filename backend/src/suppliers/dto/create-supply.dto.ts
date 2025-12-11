import { IsNumberString, IsString, MinLength } from 'class-validator';

export class CreateSupplyDto {
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


