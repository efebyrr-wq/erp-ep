import { PartialType } from '@nestjs/mapped-types';
import { CreateMachinerySpecDto } from './create-machinery-spec.dto';

export class UpdateMachinerySpecDto extends PartialType(CreateMachinerySpecDto) {}







