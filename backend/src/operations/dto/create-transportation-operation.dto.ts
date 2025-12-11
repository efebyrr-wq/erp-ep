import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTransportationOperationDto {
  @IsString()
  @IsOptional()
  plateNum?: string | null;

  @IsString()
  @IsOptional()
  startingLoc?: string | null;

  @IsString()
  @IsOptional()
  endingLoc?: string | null;

  @IsDateString()
  @IsOptional()
  operationDate?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}





