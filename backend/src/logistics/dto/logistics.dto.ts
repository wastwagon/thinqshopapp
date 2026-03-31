import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class BookShipmentDto {
    @IsOptional()
    @IsString()
    @IsIn(['courier', 'freight_forwarding'])
    type?: string;

    @IsOptional()
    @IsNumber()
    pickup_address_id?: number;

    @IsOptional()
    @IsNumber()
    delivery_address_id?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @IsNumber()
    zoneId?: number;

    @IsOptional()
    @IsString()
    service_type?: string;

    @IsOptional()
    @IsString()
    @IsIn(['wallet', 'card', 'mobile_money'])
    payment_method?: string;

    @IsOptional()
    @IsString()
    dimensions?: string;

    @IsOptional()
    @IsString()
    pickup_date?: string;

    @IsOptional()
    @IsString()
    pickup_time_slot?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    contents_description?: string;

    @IsOptional()
    @IsNumber()
    origin_warehouse_id?: number;

    @IsOptional()
    @IsNumber()
    destination_warehouse_id?: number;

    @IsOptional()
    @IsString()
    carrier_tracking_number?: string;

    @IsOptional()
    @IsString()
    @IsIn(['air_freight', 'sea_freight'])
    shipping_method?: string;

    @IsOptional()
    @IsNumber()
    shipping_rate_id?: number;

    @IsOptional()
    @IsBoolean()
    is_cod?: boolean;

    @IsOptional()
    @IsArray()
    declaration_image_urls?: string[];

    @IsOptional()
    @IsArray()
    items_declaration?: unknown[];
}

export class CalculatePriceDto {
    @IsNumber()
    zoneId: number;

    @IsNumber()
    @Min(0.01)
    weight: number;

    @IsString()
    @IsNotEmpty()
    serviceType: string;
}

export class FreightRateDto {
    @IsString()
    @IsNotEmpty()
    rate_id: string;

    @IsString()
    @IsIn(['air_freight', 'sea_freight'])
    method: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsString()
    @IsIn(['KG', 'UNIT', 'CBM'])
    type: string;

    @IsOptional()
    @IsString()
    duration?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsNumber()
    sort_order?: number;
}

export class UpdateFreightRateDto {
    @IsOptional()
    @IsString()
    rate_id?: string;

    @IsOptional()
    @IsString()
    @IsIn(['air_freight', 'sea_freight'])
    method?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    @IsIn(['KG', 'UNIT', 'CBM'])
    type?: string;

    @IsOptional()
    @IsString()
    duration?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsNumber()
    sort_order?: number;
}

export class UpdateShipmentStatusDto {
    @IsString()
    @IsIn(['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'])
    status: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
