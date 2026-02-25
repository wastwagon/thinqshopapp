import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTrustBadgeDto {
    @ApiPropertyOptional()
    @IsString()
    icon: string;

    @ApiPropertyOptional()
    @IsString()
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    optional_link?: string;

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

export class UpdateTrustBadgeDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    optional_link?: string;

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
