import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStorefrontSettingsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    free_shipping_threshold_ghs?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    standard_shipping_fee_ghs?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    site_orders_delivered_text?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    support_phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    support_email?: string;
}
