import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariationValueDto {
    @ApiProperty()
    @IsInt()
    variation_option_id: number;

    @ApiProperty()
    @IsString()
    value: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;
}

export class UpdateVariationValueDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    value?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;
}
