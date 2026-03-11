import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateInvoiceRateDto {
    @IsString()
    name: string;

    @IsString()
    unit: string;

    @IsNumber()
    @Min(0)
    rate_per_unit: number;

    @IsOptional()
    @IsString()
    mode?: string;

    @IsOptional()
    @IsNumber()
    sort_order?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
