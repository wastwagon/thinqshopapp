import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTestimonialDto {
    @ApiPropertyOptional()
    @IsString()
    quote: string;

    @ApiPropertyOptional()
    @IsString()
    author_name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    author_role?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar_path?: string;

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

export class UpdateTestimonialDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    quote?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    author_name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    author_role?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar_path?: string;

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
