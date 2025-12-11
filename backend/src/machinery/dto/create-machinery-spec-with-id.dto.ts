import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMachinerySpecWithIdDto {
  @IsString()
  @IsNotEmpty()
  machineryId!: string;

  @IsString()
  @IsNotEmpty()
  specName!: string;

  @IsString()
  @IsNotEmpty()
  specValue!: string;
}







