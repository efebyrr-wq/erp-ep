import { IsDateString, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateInternalOperationDto {
  @ValidateIf((o) => o.customerName !== null && o.customerName !== undefined && o.customerName !== '')
  @IsString()
  @IsOptional()
  customerName?: string | null;

  @ValidateIf((o) => o.machineNumber !== null && o.machineNumber !== undefined && o.machineNumber !== '')
  @IsString()
  @IsOptional()
  machineNumber?: string | null;

  @ValidateIf((o) => o.machineCode !== null && o.machineCode !== undefined && o.machineCode !== '')
  @IsString()
  @IsOptional()
  machineCode?: string | null;

  @ValidateIf((o) => o.workingSiteName !== null && o.workingSiteName !== undefined && o.workingSiteName !== '')
  @IsString()
  @IsOptional()
  workingSiteName?: string | null;

  @ValidateIf((o) => o.startDate !== null && o.startDate !== undefined && o.startDate !== '')
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ValidateIf((o) => o.endDate !== null && o.endDate !== undefined && o.endDate !== '')
  @IsDateString()
  @IsOptional()
  endDate?: string | null;
}

