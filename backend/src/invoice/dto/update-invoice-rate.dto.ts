import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceRateDto } from './create-invoice-rate.dto';

export class UpdateInvoiceRateDto extends PartialType(CreateInvoiceRateDto) {}
