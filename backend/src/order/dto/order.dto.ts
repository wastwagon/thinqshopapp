import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { AddToCartDto } from '../../cart/dto/cart.dto';

export class GuestShippingAddressDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    full_name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(20)
    phone: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    region: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    landmark?: string;
}

export class QuoteCheckoutDto {
    @IsOptional()
    @IsNumber()
    shipping_address_id?: number;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(40)
    @ValidateNested({ each: true })
    @Type(() => AddToCartDto)
    items?: AddToCartDto[];
}

export class CreateOrderDto {
    @IsNumber()
    @IsNotEmpty()
    total: number;

    @IsString()
    @IsNotEmpty()
    payment_method: string;

    @IsOptional()
    @IsNumber()
    shipping_address_id?: number;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    guest_email?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => GuestShippingAddressDto)
    shipping_address?: GuestShippingAddressDto;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(40)
    @ValidateNested({ each: true })
    @Type(() => AddToCartDto)
    items?: AddToCartDto[];
}
