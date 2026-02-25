import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHeroSlideDto {
    @ApiPropertyOptional()
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    subtitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cta_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cta_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    image_path?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateHeroSlideDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    subtitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cta_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cta_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    image_path?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
