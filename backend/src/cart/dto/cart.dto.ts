import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';

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

export class MergeCartDto {
    @IsArray()
    @ArrayMaxSize(40)
    @ValidateNested({ each: true })
    @Type(() => AddToCartDto)
    items: AddToCartDto[];
}

