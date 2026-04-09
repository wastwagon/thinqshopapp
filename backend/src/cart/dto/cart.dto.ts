import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class AddToCartDto {
    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    /** When set, must belong to the product. Separate cart lines per variant. */
    @IsOptional()
    @IsNumber()
    variantId?: number;
}

export class UpdateCartItemDto {
    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}
