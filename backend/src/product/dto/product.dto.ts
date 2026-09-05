import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

function emptyToNull({ value }: { value: unknown }) {
    if (value === null || value === '' || value === 0 || value === '0') return null;
    return value;
}

export class ProductVariantDto {
    @IsString()
    variant_type: string;

    @IsString()
    variant_value: string;

    @IsOptional()
    @IsObject()
    option_values?: Record<string, string>;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsNumber()
    price_adjust?: number;

    @IsOptional()
    @IsNumber()
    stock_quantity?: number;

    @IsOptional()
    @IsString()
    image?: string;
}

export class VariantOptionAxisDto {
    @IsString()
    slug: string;

    @IsString()
    name: string;

    @IsArray()
    @IsString({ each: true })
    values: string[];
}

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    short_description?: string;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, unknown>;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    stock_quantity?: number;

    @IsOptional()
    @IsNumber()
    compare_price?: number;

    @IsNumber()
    category_id: number;

    @IsOptional()
    @IsArray()
    images?: string[];

    @IsOptional()
    @IsBoolean()
    is_featured?: boolean;

    @IsOptional()
    @Transform(emptyToNull)
    @IsNumber()
    wholesale_min_quantity?: number | null;

    @IsOptional()
    @Transform(emptyToNull)
    @IsNumber()
    wholesale_discount_pct?: number | null;

    @IsOptional()
    @IsBoolean()
    enforce_min_quantity?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantOptionAxisDto)
    variant_options?: VariantOptionAxisDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants?: ProductVariantDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
