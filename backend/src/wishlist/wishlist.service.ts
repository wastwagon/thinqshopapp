import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistDto } from './dto/wishlist.dto';

const productInclude = { category: true, variants: true } as const;

@Injectable()
export class WishlistService {
    constructor(private prisma: PrismaService) {}

    async getWishlist(userId: number) {
        return this.prisma.wishlist.findMany({
            where: { user_id: userId },
            include: { product: { include: productInclude } },
            orderBy: { created_at: 'desc' },
        });
    }

    async add(userId: number, dto: AddToWishlistDto) {
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        if (!product) throw new NotFoundException('Product not found');
        if (!product.is_active) {
            throw new BadRequestException('This product is no longer available');
        }
        try {
            return await this.prisma.wishlist.create({
                data: { user_id: userId, product_id: dto.productId },
                include: { product: { include: productInclude } },
            });
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            if (code === 'P2002') {
                const existing = await this.prisma.wishlist.findFirst({
                    where: { user_id: userId, product_id: dto.productId },
                    include: { product: { include: productInclude } },
                });
                if (existing) return existing;
            }
            throw error;
        }
    }

    async remove(userId: number, productId: number) {
        const row = await this.prisma.wishlist.findFirst({
            where: { user_id: userId, product_id: productId },
        });
        if (!row) throw new NotFoundException('Wishlist item not found');
        await this.prisma.wishlist.delete({ where: { id: row.id } });
        return { ok: true };
    }

    async merge(userId: number, productIds: number[]) {
        const unique = [...new Set(productIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 80);
        const products = await this.prisma.product.findMany({
            where: { id: { in: unique }, is_active: true },
            select: { id: true },
        });
        const validIds = products.map((row) => row.id);
        const failed = unique.length - validIds.length;
        if (validIds.length) {
            await this.prisma.wishlist.createMany({
                data: validIds.map((product_id) => ({ user_id: userId, product_id })),
                skipDuplicates: true,
            });
        }
        return { items: await this.getWishlist(userId), failed };
    }
}
