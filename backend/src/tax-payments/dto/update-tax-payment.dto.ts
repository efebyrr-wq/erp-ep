import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxPaymentDto } from './create-tax-payment.dto';

export class UpdateTaxPaymentDto extends PartialType(CreateTaxPaymentDto) {}






