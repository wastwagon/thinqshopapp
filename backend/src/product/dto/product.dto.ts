import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class ProductVariantDto {
    @IsString()
    variant_type: string;

    @IsString()
    variant_value: string;

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

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

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
    @IsNumber()
    wholesale_min_quantity?: number;

    @IsOptional()
    @IsNumber()
    wholesale_discount_pct?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants?: ProductVariantDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
