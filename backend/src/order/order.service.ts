import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CartService } from '../cart/cart.service';
import { PaymentMethod } from '@prisma/client';
import { AddressService } from '../address/address.service';
import { PaymentService } from '../finance/payment.service';
import { EmailTemplateService } from '../email-template/email-template.service';

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
        private addressService: AddressService,
        private paymentService: PaymentService,
        private emailTemplateService: EmailTemplateService,
    ) { }

    async create(userId: number, dto: CreateOrderDto) {
        const cartItems = await this.cartService.getCart(userId);
        if (cartItems.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const address = await this.addressService.findAll(userId);
        const validAddress = address.find(a => a.id === dto.shipping_address_id);
        if (!validAddress) {
            throw new BadRequestException('Invalid shipping address');
        }

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
        const isPaystack = dto.payment_method === 'card' || dto.payment_method === 'mobile_money';

        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.order.create({
                data: {
                    user_id: userId,
                    order_number: orderNumber,
                    subtotal: subtotal,
                    total: dto.total,
                    status: dto.payment_method === 'wallet' ? 'processing' : 'pending',
                    payment_method: dto.payment_method as PaymentMethod,
                    shipping_address_id: dto.shipping_address_id,
                    payment_status: dto.payment_method === 'wallet' ? 'success' : 'pending',
                },
            });

            if (dto.payment_method === 'wallet') {
                const wallet = await prisma.userWallet.findUnique({
                    where: { user_id: userId },
                });
                if (!wallet || Number(wallet.balance_ghs) < dto.total) {
                    throw new BadRequestException('Insufficient wallet balance');
                }
                await prisma.userWallet.update({
                    where: { user_id: userId },
                    data: { balance_ghs: { decrement: dto.total } },
                });
                await prisma.payment.create({
                    data: {
                        user_id: userId,
                        amount: dto.total,
                        payment_method: 'wallet',
                        service_type: 'ecommerce',
                        service_id: order.id,
                        status: 'success',
                        transaction_ref: `WLT-ORD-${Date.now()}`,
                    },
                });
            }

            const orderItemsData = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                variant_id: item.variant_id ?? undefined,
                quantity: item.quantity,
                price: item.product.price,
                product_name: item.product.name,
                variant_details: null,
                total: Number(item.product.price) * item.quantity,
            }));

            await prisma.orderItem.createMany({
                data: orderItemsData,
            });

            if (!isPaystack) {
                await prisma.cartItem.deleteMany({
                    where: { user_id: userId },
                });
            }

            const finalOrder = await prisma.order.findUnique({
                where: { id: order.id },
                include: { items: true },
            });

            if (!isPaystack && finalOrder) {
                this.queueOrderConfirmationEmail(userId, finalOrder.order_number, String(finalOrder.total));
            }

            if (isPaystack) {
                const transactionRef = `PAY-ORD-${order.id}-${Date.now()}`;
                await prisma.payment.create({
                    data: {
                        user_id: userId,
                        amount: order.total,
                        transaction_ref: transactionRef,
                        service_type: 'ecommerce',
                        service_id: order.id,
                        status: 'pending',
                        payment_method: 'card',
                    },
                });
                return {
                    ...finalOrder,
                    paystack_reference: transactionRef,
                    amount_pesewas: Math.round(Number(order.total) * 100),
                };
            }

            return finalOrder;
        });
    }

    async confirmOrderPayment(orderId: number, userId: number, paystackReference: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.user_id !== userId) throw new BadRequestException('Unauthorized');
        if (order.payment_status === 'success') return order;

        const result = await this.paymentService.verifyWithPaystack(paystackReference);
        if (!result) throw new BadRequestException('Payment verification failed');
        const { payment } = result;
        if (payment.service_type !== 'ecommerce' || payment.service_id !== orderId) {
            throw new BadRequestException('Invalid payment for this order');
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                payment_status: 'success',
                paystack_reference: paystackReference,
                status: 'processing',
            },
        });

        await this.prisma.cartItem.deleteMany({
            where: { user_id: userId },
        });

        const updated = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (updated) {
            this.queueOrderConfirmationEmail(userId, updated.order_number, String(updated.total));
        }
        return updated;
    }

    private async queueOrderConfirmationEmail(userId: number, orderNumber: string, total: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true },
            });
            if (!user?.email) return;
            const user_name = user.profile ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ') || 'Customer' : 'Customer';
            await this.emailTemplateService.queueFromTemplate('order_placed', user.email, {
                order_number: orderNumber,
                total,
                user_name,
            });
        } catch {
            // ignore email queue errors
        }
    }

    async findAll(userId: number) {
        return this.prisma.order.findMany({
            where: { user_id: userId },
            include: { items: true }, // Correct relation name 'items'
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: number, userId: number) {
        const order = await this.prisma.order.findFirst({
            where: { id, user_id: userId },
            include: { items: { include: { product: true } } }, // Correct relation name
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async findOneForAdmin(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: { include: { profile: true } },
                shipping_address: true,
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async findAllForAdmin(query: { page?: number; limit?: number; status?: string }) {
        const { page = 1, limit = 50, status } = query;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status) where.status = status;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: { items: true, user: { include: { profile: true } }, shipping_address: true },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { data: orders, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
    }

    async updateOrderStatus(id: number, status: string) {
        return this.prisma.order.update({
            where: { id },
            data: { status: status as any },
        });
    }
}
