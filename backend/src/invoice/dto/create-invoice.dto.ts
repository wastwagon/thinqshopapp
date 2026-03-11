import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceLineItemDto {
    @IsString()
    description: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    unit: string;

    @IsNumber()
    @Min(0)
    unit_price: number;
}

export class CreateInvoiceDto {
    @IsString()
    customer_name: string;

    @IsString()
    customer_email: string;

    @IsOptional()
    @IsString()
    customer_phone?: string;

    @IsOptional()
    @IsString()
    customer_address?: string;

    @IsString()
    issue_date: string; // YYYY-MM-DD

    @IsString()
    due_date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceLineItemDto)
    items: InvoiceLineItemDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount_amount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount_percent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    tax_rate?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    currency?: string;
}
