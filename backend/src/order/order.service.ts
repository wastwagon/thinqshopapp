import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CartService } from '../cart/cart.service';
import { PaymentMethod } from '@prisma/client';
import { AddressService } from '../address/address.service';
import { PaymentService } from '../finance/payment.service';
import { EmailTemplateService } from '../email-template/email-template.service';
import { SmsService } from '../sms/sms.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
        private addressService: AddressService,
        private paymentService: PaymentService,
        private emailTemplateService: EmailTemplateService,
        private smsService: SmsService,
        private notificationService: NotificationService,
    ) { }

    private async getCheckoutPricing(userId: number, shippingAddressId: number) {
        const cartItems = await this.cartService.getCart(userId);
        if (cartItems.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const addresses = await this.addressService.findAll(userId);
        const validAddress = addresses.find((a) => a.id === shippingAddressId);
        if (!validAddress) {
            throw new BadRequestException('Invalid shipping address');
        }

        const subtotal = cartItems.reduce((sum, item) => {
            const unitPrice = item.variant
                ? Number(item.product.price) + Number(item.variant.price_adjust)
                : Number(item.product.price);
            return sum + unitPrice * item.quantity;
        }, 0);

        const settings = await this.prisma.setting.findMany({
            where: { setting_key: { in: ['free_shipping_threshold_ghs', 'standard_shipping_fee_ghs'] } },
        });
        const map = new Map(settings.map((s) => [s.setting_key, s.setting_value ?? '']));
        const freeShippingThreshold = Number(map.get('free_shipping_threshold_ghs') || 0);
        const standardShippingFee = Number(map.get('standard_shipping_fee_ghs') || 0);
        const shippingFee = Number.isFinite(standardShippingFee) && standardShippingFee > 0
            ? (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : standardShippingFee)
            : 0;

        const tax = 0;
        const discount = 0;
        const total = subtotal + shippingFee + tax - discount;
        return {
            subtotal: Number(subtotal.toFixed(2)),
            shipping_fee: Number(shippingFee.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            total: Number(total.toFixed(2)),
            item_count: cartItems.length,
        };
    }

    async quoteCheckout(userId: number, shippingAddressId: number) {
        return this.getCheckoutPricing(userId, shippingAddressId);
    }

    async create(userId: number, dto: CreateOrderDto) {
        const pricing = await this.getCheckoutPricing(userId, dto.shipping_address_id);
        const cartItems = await this.cartService.getCart(userId);
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const authoritativeTotal = pricing.total;
        const clientTotal = Number(dto.total);
        if (!Number.isFinite(clientTotal) || Math.abs(clientTotal - authoritativeTotal) > 0.01) {
            throw new BadRequestException('Checkout total mismatch. Please refresh your cart and try again.');
        }
        const isPaystack = dto.payment_method === 'card' || dto.payment_method === 'mobile_money';

        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.order.create({
                data: {
                    user_id: userId,
                    order_number: orderNumber,
                    subtotal: pricing.subtotal,
                    shipping_fee: pricing.shipping_fee,
                    tax: pricing.tax,
                    discount: pricing.discount,
                    total: authoritativeTotal,
                    status: dto.payment_method === 'wallet' ? 'processing' : 'pending',
                    payment_method: dto.payment_method as PaymentMethod,
                    shipping_address_id: dto.shipping_address_id,
                    payment_status: dto.payment_method === 'wallet' ? 'success' : 'pending',
                },
            });
            await prisma.orderTracking.create({
                data: {
                    order_id: order.id,
                    status: order.status,
                    notes: dto.payment_method === 'wallet' ? 'Order paid from wallet and queued for processing' : 'Order created, awaiting payment confirmation',
                },
            });

            if (dto.payment_method === 'wallet') {
                const wallet = await prisma.userWallet.findUnique({
                    where: { user_id: userId },
                });
                if (!wallet || Number(wallet.balance_ghs) < authoritativeTotal) {
                    throw new BadRequestException('Insufficient wallet balance');
                }
                await prisma.userWallet.update({
                    where: { user_id: userId },
                    data: { balance_ghs: { decrement: authoritativeTotal } },
                });
                await prisma.payment.create({
                    data: {
                        user_id: userId,
                        amount: authoritativeTotal,
                        payment_method: 'wallet',
                        service_type: 'ecommerce',
                        service_id: order.id,
                        status: 'success',
                        transaction_ref: `WLT-ORD-${Date.now()}`,
                    },
                });
            }

            const orderItemsData = cartItems.map((item) => {
                const unitPrice = item.variant
                    ? Number(item.product.price) + Number(item.variant.price_adjust)
                    : Number(item.product.price);
                const variantDetails = item.variant
                    ? `${item.variant.variant_type}: ${item.variant.variant_value}`.replace(/_/g, ' ')
                    : null;
                return {
                    order_id: order.id,
                    product_id: item.product_id,
                    variant_id: item.variant_id ?? undefined,
                    quantity: item.quantity,
                    price: unitPrice,
                    product_name: item.product.name,
                    variant_details: variantDetails,
                    total: unitPrice * item.quantity,
                };
            });

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
                this.smsService.sendToUser(userId, `Your order ${finalOrder.order_number} has been placed. Total: GHS ${finalOrder.total}. Thank you for shopping with ThinQShop!`).catch(() => {});
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
        await this.prisma.orderTracking.create({
            data: {
                order_id: orderId,
                status: 'processing',
                notes: 'Payment confirmed via Paystack',
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
            this.smsService.sendToUser(userId, `Payment confirmed. Your order ${updated.order_number} (GHS ${updated.total}) is being processed. Thank you!`).catch(() => {});
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
            include: { items: { include: { product: true, variant: true } }, tracking: { orderBy: { created_at: 'asc' } } },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async findOneForAdmin(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true, variant: true } },
                user: { include: { profile: true } },
                shipping_address: true,
                tracking: { orderBy: { created_at: 'asc' } },
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    /** Public lookup by order_number for track page. Returns minimal safe data (no user email, no full address). */
    async findOneByOrderNumber(orderNumber: string) {
        const order = await this.prisma.order.findUnique({
            where: { order_number: orderNumber },
            include: {
                items: { select: { product_name: true, quantity: true, price: true, total: true } },
                shipping_address: { select: { city: true, region: true } },
                tracking: { select: { status: true, notes: true, created_at: true }, orderBy: { created_at: 'asc' } },
            },
        });
        if (!order) return null;
        return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            payment_method: order.payment_method,
            created_at: order.created_at,
            items: order.items,
            items_count: order.items.length,
            shipping_region: order.shipping_address ? `${order.shipping_address.city || ''} ${order.shipping_address.region || ''}`.trim() : null,
            tracking: order.tracking,
        };
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
        const order = await this.prisma.order.update({
            where: { id },
            data: { status: status as any },
        });
        await this.prisma.orderTracking.create({
            data: {
                order_id: order.id,
                status,
                notes: `Status changed to ${status.replace(/_/g, ' ')}`,
            },
        });
        const statusMsg = status.replace(/_/g, ' ');
        this.smsService.sendToUser(order.user_id, `Your order ${order.order_number} status: ${statusMsg}. Track at ThinQShop.`).catch(() => {});
        return order;
    }

    async cancelOwnOrder(id: number, userId: number) {
        const order = await this.prisma.order.findFirst({
            where: { id, user_id: userId },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'pending' || order.payment_status !== 'pending') {
            throw new BadRequestException('Only unpaid pending orders can be cancelled');
        }
        const updated = await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' },
        });
        await this.prisma.orderTracking.create({
            data: {
                order_id: updated.id,
                status: 'cancelled',
                notes: 'Cancelled by customer before payment',
            },
        });
        return updated;
    }

    async requestReturn(userId: number, id: number, reason: string) {
        const order = await this.prisma.order.findFirst({
            where: { id, user_id: userId },
            include: { tracking: { orderBy: { created_at: 'asc' } } },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'delivered') {
            throw new BadRequestException('Only delivered orders can request returns');
        }
        const alreadyRequested = order.tracking.some((t) => t.status === 'return_requested');
        if (alreadyRequested) {
            throw new BadRequestException('Return already requested for this order');
        }

        await this.prisma.orderTracking.create({
            data: {
                order_id: order.id,
                status: 'return_requested',
                notes: reason.trim(),
            },
        });

        const supportSetting = await this.prisma.setting.findUnique({ where: { setting_key: 'support_email' } });
        const supportEmail = supportSetting?.setting_value?.trim() || 'info@thinqshopping.app';
        await this.prisma.emailQueue.create({
            data: {
                recipient: supportEmail,
                subject: `[Return Request] ${order.order_number}`,
                body: `Order: ${order.order_number}\nUser ID: ${userId}\nReason: ${reason.trim()}`,
                status: 'pending',
            },
        });

        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['admin', 'superadmin'] } },
            select: { id: true },
        });
        await Promise.all(
            admins.map((admin) =>
                this.notificationService.createNotification({
                    userId: admin.id,
                    type: 'return_request',
                    title: `Return requested: ${order.order_number}`,
                    message: `Customer requested a return for ${order.order_number}.`,
                    link: `/admin/orders/${order.id}`,
                }),
            ),
        );

        await this.notificationService.createNotification({
            userId,
            type: 'return_request',
            title: 'Return request submitted',
            message: `Your return request for ${order.order_number} has been received.`,
            link: `/dashboard/orders/${order.id}`,
        });

        return { message: 'Return request submitted' };
    }

    async resolveReturnRequest(orderId: number, action: 'approve' | 'reject' | 'refund', notes?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { tracking: { orderBy: { created_at: 'asc' } } },
        });
        if (!order) throw new NotFoundException('Order not found');

        const hasRequest = order.tracking.some((t) => t.status === 'return_requested');
        if (!hasRequest) {
            throw new BadRequestException('No return request found for this order');
        }
        const alreadyResolved = order.tracking.some((t) =>
            t.status === 'return_approved' || t.status === 'return_rejected' || t.status === 'refunded',
        );
        if (alreadyResolved) {
            throw new BadRequestException('Return request already resolved');
        }

        let trackingStatus = 'return_approved';
        let trackingNotes = notes?.trim() || 'Return request approved by admin';
        const orderData: any = {};

        if (action === 'reject') {
            trackingStatus = 'return_rejected';
            trackingNotes = notes?.trim() || 'Return request rejected by admin';
        } else if (action === 'refund') {
            trackingStatus = 'refunded';
            trackingNotes = notes?.trim() || 'Refund processed by admin';
            orderData.payment_status = 'refunded';
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            if (Object.keys(orderData).length > 0) {
                await tx.order.update({
                    where: { id: order.id },
                    data: orderData,
                });
            }
            await tx.orderTracking.create({
                data: {
                    order_id: order.id,
                    status: trackingStatus,
                    notes: trackingNotes,
                },
            });
            return tx.order.findUnique({
                where: { id: order.id },
                include: { items: true, tracking: { orderBy: { created_at: 'asc' } } },
            });
        });

        await this.notificationService.createNotification({
            userId: order.user_id,
            type: 'return_request',
            title: `Return ${action === 'refund' ? 'refunded' : action === 'approve' ? 'approved' : 'rejected'}`,
            message: action === 'refund'
                ? `Your return for ${order.order_number} has been refunded.`
                : action === 'approve'
                    ? `Your return for ${order.order_number} has been approved.`
                    : `Your return for ${order.order_number} was not approved.`,
            link: `/dashboard/orders/${order.id}`,
        });

        return updated;
    }
}
