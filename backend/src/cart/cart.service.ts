import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) { }

    async getCart(userId: number) {
        return this.prisma.cartItem.findMany({
            where: { user_id: userId },
            include: { product: true, variant: true },
        });
    }

    private assertQuantityAllowed(
        product: { is_active: boolean; is_consignment: boolean; stock_quantity: number; consignor_user_id: number | null },
        variant: { stock_quantity: number } | null,
        quantity: number,
        userId: number,
    ) {
        if (!product.is_active) {
            throw new BadRequestException('This product is no longer available');
        }
        if (product.is_consignment && product.consignor_user_id === userId) {
            throw new BadRequestException('You cannot purchase your own consignment listing');
        }
        if (product.is_consignment && quantity > 1) {
            throw new BadRequestException('Consignment items can only be purchased one at a time');
        }
        const stock = variant ? Number(variant.stock_quantity) : Number(product.stock_quantity);
        if (quantity > stock) {
            throw new BadRequestException(
                stock <= 0 ? 'This item is out of stock' : `Only ${stock} available`,
            );
        }
    }

    async addToCart(userId: number, dto: AddToCartDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
            include: { variants: true },
        });

        if (!product) throw new NotFoundException('Product not found');

        let variant: (typeof product.variants)[number] | null = null;
        let variantId: number | null = null;
        if (dto.variantId != null) {
            const v = product.variants.find((x) => x.id === dto.variantId);
            if (!v) throw new BadRequestException('Variant does not belong to this product');
            variant = v;
            variantId = v.id;
        }

        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                user_id: userId,
                product_id: dto.productId,
                variant_id: variantId,
            },
        });

        const nextQty = (existingItem?.quantity ?? 0) + dto.quantity;
        this.assertQuantityAllowed(product, variant, nextQty, userId);

        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: nextQty },
            });
        }

        return this.prisma.cartItem.create({
            data: {
                user_id: userId,
                product_id: dto.productId,
                variant_id: variantId,
                quantity: dto.quantity,
            },
        });
    }

    async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
        const item = await this.prisma.cartItem.findFirst({
            where: { id: itemId, user_id: userId },
            include: { product: true, variant: true },
        });

        if (!item) throw new NotFoundException('Cart item not found');

        if (dto.quantity <= 0) {
            return this.removeFromCart(userId, itemId);
        }

        this.assertQuantityAllowed(item.product, item.variant, dto.quantity, userId);

        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity },
        });
    }

    async removeFromCart(userId: number, itemId: number) {
        const item = await this.prisma.cartItem.findFirst({
            where: { id: itemId, user_id: userId }
        });

        if (!item) throw new NotFoundException('Cart item not found');

        return this.prisma.cartItem.delete({
            where: { id: itemId },
        });
    }

    async clearCart(userId: number) {
        return this.prisma.cartItem.deleteMany({
            where: { user_id: userId },
        });
    }
}
