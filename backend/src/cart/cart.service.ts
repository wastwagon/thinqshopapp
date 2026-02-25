import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) { }

    async getCart(userId: number) {
        return this.prisma.cartItem.findMany({
            where: { user_id: userId },
            include: { product: true },
        });
    }

    async addToCart(userId: number, dto: AddToCartDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId }
        });

        if (!product) throw new NotFoundException('Product not found');

        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                user_id: userId,
                product_id: dto.productId,
            },
        });

        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + dto.quantity },
            });
        }

        return this.prisma.cartItem.create({
            data: {
                user_id: userId,
                product_id: dto.productId,
                quantity: dto.quantity,
            },
        });
    }

    async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
        const item = await this.prisma.cartItem.findFirst({
            where: { id: itemId, user_id: userId }
        });

        if (!item) throw new NotFoundException('Cart item not found');

        if (dto.quantity <= 0) {
            return this.removeFromCart(userId, itemId);
        }

        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity }
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
