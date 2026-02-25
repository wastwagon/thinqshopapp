import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

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
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
