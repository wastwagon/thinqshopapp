import { IsString, IsBoolean, IsInt, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHomepageSectionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_enabled?: boolean;
}

export class ReorderSectionsDto {
    @ApiPropertyOptional({ description: 'Ordered array of section_key' })
    @IsString({ each: true })
    section_keys: string[];
}
