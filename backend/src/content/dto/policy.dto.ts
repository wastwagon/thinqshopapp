import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    short_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    full_text?: string;
}
