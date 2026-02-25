import { IsInt, Min, Max, IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({ minimum: 1, maximum: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    review_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    review_images?: string[];

    @ApiPropertyOptional({ description: 'Display name for PDP (e.g. "Kofi M.")' })
    @IsOptional()
    @IsString()
    display_name?: string;
}

export class UpdateReviewAdminDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    review_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_approved?: boolean;
}
