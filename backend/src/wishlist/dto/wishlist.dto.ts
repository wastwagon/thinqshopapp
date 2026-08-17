import { ArrayMaxSize, IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class AddToWishlistDto {
    @IsNumber()
    @IsNotEmpty()
    productId: number;
}

export class MergeWishlistDto {
    @IsArray()
    @ArrayMaxSize(80)
    @IsNumber({}, { each: true })
    productIds: number[];
}

