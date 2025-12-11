import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMachinerySpecDto {
  @IsString()
  @IsNotEmpty()
  specName!: string;

  @IsString()
  @IsNotEmpty()
  specValue!: string;
}







