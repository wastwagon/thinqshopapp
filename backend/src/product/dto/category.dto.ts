import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsNumber()
    parent_id?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsNumber()
    sort_order?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
