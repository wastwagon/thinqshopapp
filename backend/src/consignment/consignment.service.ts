import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../finance/wallet.service';
import { EmailTemplateService } from '../email-template/email-template.service';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';
import {
    ApproveConsignmentDto,
    CreateConsignmentSubmissionDto,
} from './dto/consignment.dto';

const FALLBACK_COMMISSION_PCT = 20;
const SETTING_COMMISSION = 'consignment_commission_pct_default';
const SETTING_ENABLED = 'sell_for_me_enabled';

@Injectable()
export class ConsignmentService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private emailTemplateService: EmailTemplateService,
        private notificationService: NotificationService,
        private smsService: SmsService,
    ) { }

    private slugify(s: string): string {
        return s
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || `item-${Date.now()}`;
    }

    private async uniqueSlug(base: string): Promise<string> {
        let slug = this.slugify(base);
        let n = 0;
        while (await this.prisma.product.findUnique({ where: { slug } })) {
            n += 1;
            slug = `${this.slugify(base)}-${n}`;
        }
        return slug;
    }

    private submissionNumber(): string {
        return `CON-${Date.now()}`;
    }

    private frontendBaseUrl(): string {
        return (process.env.FRONTEND_URL || 'http://localhost:7001').replace(/\/$/, '');
    }

    private async getSettingValue(key: string): Promise<string | null> {
        const row = await this.prisma.setting.findUnique({ where: { setting_key: key } });
        return row?.setting_value ?? null;
    }

    async getPublicSettings() {
        const enabledRaw = await this.getSettingValue(SETTING_ENABLED);
        const commissionRaw = await this.getSettingValue(SETTING_COMMISSION);
        const commission = Number(commissionRaw);
        return {
            sell_for_me_enabled: enabledRaw !== 'false',
            default_commission_pct: Number.isFinite(commission) && commission >= 0 ? commission : FALLBACK_COMMISSION_PCT,
        };
    }

    async getAdminSettings() {
        return this.getPublicSettings();
    }

    async updateAdminSettings(data: { default_commission_pct?: number; sell_for_me_enabled?: boolean }) {
        const ops: Promise<unknown>[] = [];
        if (data.default_commission_pct !== undefined) {
            const v = String(data.default_commission_pct);
            ops.push(
                this.prisma.setting.upsert({
                    where: { setting_key: SETTING_COMMISSION },
                    update: { setting_value: v, updated_at: new Date() },
                    create: { setting_key: SETTING_COMMISSION, setting_value: v, updated_at: new Date() },
                }),
            );
        }
        if (data.sell_for_me_enabled !== undefined) {
            const v = data.sell_for_me_enabled ? 'true' : 'false';
            ops.push(
                this.prisma.setting.upsert({
                    where: { setting_key: SETTING_ENABLED },
                    update: { setting_value: v, updated_at: new Date() },
                    create: { setting_key: SETTING_ENABLED, setting_value: v, updated_at: new Date() },
                }),
            );
        }
        if (ops.length) await Promise.all(ops);
        return this.getAdminSettings();
    }

    private async getDefaultCommissionPct(): Promise<number> {
        const settings = await this.getPublicSettings();
        return settings.default_commission_pct;
    }

    private async userDisplayName(userId: number): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) return 'Customer';
        const p = user.profile;
        const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : '';
        return name || user.email;
    }

    private async notifyListed(userId: number, itemName: string, submissionNumber: string, productSlug: string) {
        const user_name = await this.userDisplayName(userId);
        const product_url = `${this.frontendBaseUrl()}/products/${productSlug}`;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_listed', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
                product_url,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Listing is live',
            message: `"${itemName}" is now on the ThinQShop store.`,
            link: `/products/${productSlug}`,
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop Sell for Me: "${itemName}" is now live on our shop. Track it in your dashboard.`,
        ).catch(() => {});
    }

    private async notifySold(userId: number, itemName: string, orderNumber: string) {
        const user_name = await this.userDisplayName(userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_sold', user.email, {
                user_name,
                item_name: itemName,
                order_number: orderNumber,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Your item sold',
            message: `"${itemName}" was purchased (order ${orderNumber}). Payout after delivery.`,
            link: '/dashboard/sell-for-me',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Your item "${itemName}" sold (order ${orderNumber}). Payout after delivery.`,
        ).catch(() => {});
    }

    private async notifyPayout(userId: number, itemName: string, submissionNumber: string, payoutAmount: number) {
        const user_name = await this.userDisplayName(userId);
        const payout_amount = payoutAmount.toFixed(2);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_payout', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
                payout_amount,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Payout credited',
            message: `₵${payout_amount} credited to your wallet for "${itemName}".`,
            link: '/dashboard/wallet',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: ₵${payout_amount} credited to your wallet for Sell for Me sale (${submissionNumber}).`,
        ).catch(() => {});
    }

    async createSubmission(userId: number, dto: CreateConsignmentSubmissionDto) {
        const settings = await this.getPublicSettings();
        if (!settings.sell_for_me_enabled) {
            throw new BadRequestException('Sell for Me is temporarily unavailable');
        }
        const category = await this.prisma.category.findFirst({
            where: { id: dto.category_id, is_active: true },
        });
        if (!category) throw new BadRequestException('Invalid category');

        const specs: Record<string, unknown> = {
            ...(dto.specifications ?? {}),
            condition: dto.condition,
        };
        if (dto.brand?.trim()) specs.brand = dto.brand.trim();
        if (dto.model?.trim()) specs.model = dto.model.trim();
        if (dto.serial_number?.trim()) specs.serial_number = dto.serial_number.trim();

        return this.prisma.consignmentSubmission.create({
            data: {
                user_id: userId,
                submission_number: this.submissionNumber(),
                name: dto.name.trim(),
                short_description: dto.short_description?.trim() || null,
                description: dto.description.trim(),
                category_id: dto.category_id,
                asking_price: dto.asking_price,
                condition: dto.condition,
                images: dto.images,
                specifications: specs as Prisma.InputJsonValue,
                pickup_details: dto.pickup_details.trim(),
                status: 'submitted',
            },
            include: { category: true },
        });
    }

    async findUserSubmissions(userId: number) {
        return this.prisma.consignmentSubmission.findMany({
            where: { user_id: userId },
            include: { category: true, product: { select: { id: true, slug: true, is_active: true } } },
            orderBy: { created_at: 'desc' },
        });
    }

    async findUserSubmission(userId: number, id: number) {
        const row = await this.prisma.consignmentSubmission.findFirst({
            where: { id, user_id: userId },
            include: { category: true, product: true },
        });
        if (!row) throw new NotFoundException('Submission not found');
        return row;
    }

    async findAllForAdmin(status?: string) {
        const where: Prisma.ConsignmentSubmissionWhereInput = {};
        if (status?.trim()) where.status = status.trim() as any;
        return this.prisma.consignmentSubmission.findMany({
            where,
            include: {
                category: true,
                product: { select: { id: true, slug: true, is_active: true } },
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        profile: { select: { first_name: true, last_name: true } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOneForAdmin(id: number) {
        const row = await this.prisma.consignmentSubmission.findUnique({
            where: { id },
            include: {
                category: true,
                product: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        profile: { select: { first_name: true, last_name: true } },
                    },
                },
            },
        });
        if (!row) throw new NotFoundException('Submission not found');
        return row;
    }

    async markUnderReview(id: number, adminId: number) {
        const row = await this.findOneForAdmin(id);
        if (!['submitted', 'changes_requested'].includes(row.status)) {
            throw new BadRequestException('Submission cannot be moved to review');
        }
        return this.prisma.consignmentSubmission.update({
            where: { id },
            data: { status: 'under_review', reviewed_by_admin_id: adminId },
        });
    }

    async approveSubmission(id: number, adminId: number, dto: ApproveConsignmentDto) {
        const submission = await this.findOneForAdmin(id);
        if (!['submitted', 'under_review', 'changes_requested'].includes(submission.status)) {
            throw new BadRequestException('Submission cannot be approved in current status');
        }
        if (submission.product_id) {
            throw new BadRequestException('Submission already has a live product');
        }

        const approvedPrice = dto.approved_price ?? Number(submission.asking_price);
        const commissionPct = dto.commission_pct ?? await this.getDefaultCommissionPct();
        const name = dto.name?.trim() || submission.name;
        const description = dto.description?.trim() || submission.description;
        const shortDescription = dto.short_description?.trim() || submission.short_description;
        const slug = await this.uniqueSlug(name);
        const images = Array.isArray(submission.images) ? submission.images : [];

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    slug,
                    sku: `CON-${submission.submission_number}`,
                    description,
                    short_description: shortDescription,
                    price: approvedPrice,
                    compare_price: dto.compare_price ?? null,
                    stock_quantity: 1,
                    category_id: submission.category_id,
                    images: images as Prisma.InputJsonValue,
                    specifications: submission.specifications ?? Prisma.JsonNull,
                    is_active: true,
                    is_consignment: true,
                    consignor_user_id: submission.user_id,
                    commission_pct: commissionPct,
                },
            });

            const updated = await tx.consignmentSubmission.update({
                where: { id },
                data: {
                    status: 'listed',
                    product_id: product.id,
                    approved_price: approvedPrice,
                    compare_price: dto.compare_price ?? null,
                    commission_pct: commissionPct,
                    name,
                    description,
                    short_description: shortDescription,
                    reviewed_by_admin_id: adminId,
                    reviewed_at: new Date(),
                },
                include: {
                    category: true,
                    product: true,
                    user: { select: { id: true, email: true } },
                },
            });

            return { submission: updated, product };
        }).then(async (result) => {
            await this.notifyListed(
                submission.user_id,
                result.product.name,
                submission.submission_number,
                result.product.slug,
            );
            return result;
        });
    }

    async rejectSubmission(id: number, adminId: number, rejectionReason: string) {
        const submission = await this.findOneForAdmin(id);
        if (!['submitted', 'under_review', 'changes_requested'].includes(submission.status)) {
            throw new BadRequestException('Submission cannot be rejected in current status');
        }
        return this.prisma.consignmentSubmission.update({
            where: { id },
            data: {
                status: 'rejected',
                rejection_reason: rejectionReason.trim(),
                reviewed_by_admin_id: adminId,
                reviewed_at: new Date(),
            },
        });
    }

    async requestChanges(id: number, adminId: number, adminNotes: string) {
        const submission = await this.findOneForAdmin(id);
        if (!['submitted', 'under_review'].includes(submission.status)) {
            throw new BadRequestException('Cannot request changes for this submission');
        }
        return this.prisma.consignmentSubmission.update({
            where: { id },
            data: {
                status: 'changes_requested',
                admin_notes: adminNotes.trim(),
                reviewed_by_admin_id: adminId,
                reviewed_at: new Date(),
            },
        });
    }

    async countPendingForAdmin() {
        return this.prisma.consignmentSubmission.count({
            where: { status: { in: ['submitted', 'under_review'] } },
        });
    }

    /** When order is paid — remove consignment items from shop */
    async handleOrderPaid(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });
        if (!order || order.payment_status !== 'success') return;

        for (const item of order.items) {
            const product = item.product;
            if (!product?.is_consignment) continue;

            await this.prisma.product.update({
                where: { id: product.id },
                data: { stock_quantity: 0, is_active: false },
            });

            const submission = await this.prisma.consignmentSubmission.findFirst({
                where: { product_id: product.id },
            });
            if (submission && submission.status === 'listed') {
                await this.prisma.consignmentSubmission.update({
                    where: { id: submission.id },
                    data: { status: 'sold' },
                });
                await this.notifySold(
                    product.consignor_user_id ?? submission.user_id,
                    product.name,
                    order.order_number,
                );
            }
        }
    }

    /** When order is delivered — credit consignor wallet minus commission */
    async handleOrderDelivered(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });
        if (!order) return;

        for (const item of order.items) {
            const product = item.product;
            if (!product?.is_consignment || !product.consignor_user_id) continue;

            const submission = await this.prisma.consignmentSubmission.findFirst({
                where: { product_id: product.id },
            });
            if (!submission) continue;
            if (submission.status === 'paid_out') continue;

            const saleAmount = Number(item.total);
            const commissionPct = Number(submission.commission_pct ?? product.commission_pct ?? FALLBACK_COMMISSION_PCT);
            const commission = saleAmount * (commissionPct / 100);
            const payout = Math.max(0, saleAmount - commission);

            if (payout <= 0) {
                await this.prisma.consignmentSubmission.update({
                    where: { id: submission.id },
                    data: { status: 'paid_out', payout_order_id: orderId },
                });
                continue;
            }

            await this.walletService.credit(
                product.consignor_user_id,
                payout,
                'consignment_payout',
                `Sell for Me payout: ${product.name} (${submission.submission_number})`,
                submission.id,
            );

            await this.prisma.consignmentSubmission.update({
                where: { id: submission.id },
                data: { status: 'paid_out', payout_order_id: orderId },
            });

            await this.notifyPayout(
                product.consignor_user_id,
                product.name,
                submission.submission_number,
                payout,
            );
        }
    }
}
