import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const MACHINERY_STATUS_VALUES = ['IDLE', 'ACTIVE', 'MAINTANANCE'] as const;
export type MachineryStatus = (typeof MACHINERY_STATUS_VALUES)[number];

export class CreateMachineryDto {
  @IsString()
  @IsNotEmpty()
  machineNumber!: string;

  @IsString()
  @IsNotEmpty()
  machineCode!: string;

  @IsOptional()
  @IsString()
  @IsIn(MACHINERY_STATUS_VALUES)
  status?: MachineryStatus;
}







