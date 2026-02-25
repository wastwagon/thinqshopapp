import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
    @IsNumber()
    @IsNotEmpty()
    total: number;

    @IsString()
    @IsNotEmpty()
    payment_method: string;

    @IsNumber()
    @IsNotEmpty()
    shipping_address_id: number;
}
