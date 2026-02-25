import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddToCartDto {
    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}

export class UpdateCartItemDto {
    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}
