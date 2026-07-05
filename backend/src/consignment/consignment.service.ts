import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Prisma, ConsignmentEscrowEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../finance/wallet.service';
import { EmailTemplateService } from '../email-template/email-template.service';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';
import { OrderService } from '../order/order.service';
import {
    ApproveConsignmentDto,
    CreateConsignmentSubmissionDto,
} from './dto/consignment.dto';

const FALLBACK_COMMISSION_PCT = 20;
const SETTING_COMMISSION = 'consignment_commission_pct_default';
const SETTING_ENABLED = 'sell_for_me_enabled';
const SETTING_AUTO_RELEASE_DAYS = 'consignment_auto_release_days_after_shipped';

@Injectable()
export class ConsignmentService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private emailTemplateService: EmailTemplateService,
        private notificationService: NotificationService,
        private smsService: SmsService,
        @Inject(forwardRef(() => OrderService)) private orderService: OrderService,
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
        return `CON-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
        const base = await this.getPublicSettings();
        const autoRaw = await this.getSettingValue(SETTING_AUTO_RELEASE_DAYS);
        const autoDays = Number(autoRaw);
        return {
            ...base,
            auto_release_days_after_shipped: Number.isFinite(autoDays) && autoDays >= 0 ? autoDays : 0,
        };
    }

    async updateAdminSettings(data: {
        default_commission_pct?: number;
        sell_for_me_enabled?: boolean;
        auto_release_days_after_shipped?: number;
    }) {
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
        if (data.auto_release_days_after_shipped !== undefined) {
            const days = Math.max(0, Math.floor(Number(data.auto_release_days_after_shipped)));
            const v = String(days);
            ops.push(
                this.prisma.setting.upsert({
                    where: { setting_key: SETTING_AUTO_RELEASE_DAYS },
                    update: { setting_value: v, updated_at: new Date() },
                    create: { setting_key: SETTING_AUTO_RELEASE_DAYS, setting_value: v, updated_at: new Date() },
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

    /** Net payout to consignor after platform commission. */
    computeExpectedPayout(
        saleAmount: number,
        commissionPct: number,
    ): number {
        const amount = Number(saleAmount);
        const pct = Number(commissionPct);
        if (!Number.isFinite(amount) || amount <= 0) return 0;
        const commission = amount * ((Number.isFinite(pct) ? pct : FALLBACK_COMMISSION_PCT) / 100);
        return Math.max(0, Number((amount - commission).toFixed(2)));
    }

    private parseCommissionDateRange(from?: string, to?: string): { start: Date; end: Date; fromKey: string; toKey: string } {
        const toMatch = to?.trim().match(/^(\d{4}-\d{2}-\d{2})$/);
        const fromMatch = from?.trim().match(/^(\d{4}-\d{2}-\d{2})$/);
        const endBase = toMatch ? new Date(`${toMatch[1]}T00:00:00.000Z`) : new Date();
        const end = new Date(Date.UTC(
            endBase.getUTCFullYear(),
            endBase.getUTCMonth(),
            endBase.getUTCDate(),
            23,
            59,
            59,
            999,
        ));
        let start: Date;
        if (fromMatch) {
            start = new Date(`${fromMatch[1]}T00:00:00.000Z`);
        } else {
            const fallback = new Date(end);
            fallback.setUTCDate(fallback.getUTCDate() - 29);
            start = new Date(Date.UTC(
                fallback.getUTCFullYear(),
                fallback.getUTCMonth(),
                fallback.getUTCDate(),
                0,
                0,
                0,
                0,
            ));
        }
        const fromKey = fromMatch?.[1] ?? start.toISOString().slice(0, 10);
        const toKey = toMatch?.[1] ?? end.toISOString().slice(0, 10);
        return { start, end, fromKey, toKey };
    }

    private pickOrderItemForSubmission<
        T extends { product_id: number; order_id: number; total: unknown; order: { payment_status: string } },
    >(
        submission: { product_id?: number | null; sale_order_id?: number | null },
        itemsByProduct: Map<number, T[]>,
    ): T | null {
        if (!submission.product_id) return null;
        const items = itemsByProduct.get(submission.product_id) ?? [];
        if (!items.length) return null;
        if (submission.sale_order_id) {
            const matched = items.find((item) => item.order_id === submission.sale_order_id);
            if (matched) return matched;
        }
        const paid = items.find((item) => item.order.payment_status === 'success');
        return paid ?? items[0];
    }

    private resolveSubmissionFinancials(
        submission: {
            id: number;
            commission_pct?: unknown;
            expected_payout_ghs?: unknown;
        },
        context: {
            orderItem?: { total: unknown } | null;
            payoutAmount?: number | null;
            defaultCommissionPct: number;
        },
    ) {
        const commissionPct = Number(submission.commission_pct ?? context.defaultCommissionPct);
        const saleAmount = context.orderItem ? Number(context.orderItem.total) : null;
        let sellerPayout: number | null = null;

        if (context.payoutAmount != null) {
            sellerPayout = context.payoutAmount;
        } else if (submission.expected_payout_ghs != null) {
            sellerPayout = Number(submission.expected_payout_ghs);
        } else if (saleAmount != null && Number.isFinite(saleAmount)) {
            sellerPayout = this.computeExpectedPayout(saleAmount, commissionPct);
        }

        let commissionGhs: number | null = null;
        if (saleAmount != null && sellerPayout != null && Number.isFinite(saleAmount)) {
            commissionGhs = Number((saleAmount - sellerPayout).toFixed(2));
        } else if (saleAmount != null && Number.isFinite(saleAmount)) {
            commissionGhs = Number((saleAmount * (commissionPct / 100)).toFixed(2));
        }

        return {
            sale_amount_ghs: saleAmount != null && Number.isFinite(saleAmount) ? Number(saleAmount.toFixed(2)) : null,
            commission_pct: Number.isFinite(commissionPct) ? commissionPct : context.defaultCommissionPct,
            commission_ghs: commissionGhs,
            seller_payout_ghs: sellerPayout != null && Number.isFinite(sellerPayout)
                ? Number(sellerPayout.toFixed(2))
                : null,
        };
    }

    private async buildFinancialContext(submissions: Array<{ id: number; product_id?: number | null }>) {
        const productIds = [...new Set(submissions.map((s) => s.product_id).filter((id): id is number => id != null))];
        const submissionIds = submissions.map((s) => s.id);
        const defaultCommissionPct = await this.getDefaultCommissionPct();

        const [orderItems, payoutTxs] = await Promise.all([
            productIds.length
                ? this.prisma.orderItem.findMany({
                    where: { product_id: { in: productIds } },
                    select: {
                        product_id: true,
                        order_id: true,
                        total: true,
                        order: { select: { payment_status: true } },
                    },
                    orderBy: { id: 'desc' },
                })
                : [],
            submissionIds.length
                ? this.prisma.walletTransaction.findMany({
                    where: {
                        source: 'consignment_payout',
                        reference_id: { in: submissionIds },
                        type: 'credit',
                    },
                    select: { reference_id: true, amount_ghs: true },
                })
                : [],
        ]);

        const payoutBySubmission = new Map<number, number>();
        for (const tx of payoutTxs) {
            if (tx.reference_id != null) {
                payoutBySubmission.set(tx.reference_id, Number(tx.amount_ghs));
            }
        }

        const itemsByProduct = new Map<number, typeof orderItems>();
        for (const item of orderItems) {
            const list = itemsByProduct.get(item.product_id) ?? [];
            list.push(item);
            itemsByProduct.set(item.product_id, list);
        }

        return { defaultCommissionPct, payoutBySubmission, itemsByProduct };
    }

    private async attachFinancialsToSubmissions<
        T extends { id: number; product_id?: number | null; sale_order_id?: number | null; commission_pct?: unknown; expected_payout_ghs?: unknown },
    >(submissions: T[]) {
        if (!submissions.length) return [];
        const context = await this.buildFinancialContext(submissions);
        return submissions.map((submission) => ({
            ...submission,
            ...this.resolveSubmissionFinancials(submission, {
                orderItem: this.pickOrderItemForSubmission(submission, context.itemsByProduct),
                payoutAmount: context.payoutBySubmission.get(submission.id) ?? null,
                defaultCommissionPct: context.defaultCommissionPct,
            }),
        }));
    }

    /** Realized commission from escrow releases in a date range, plus pending escrow totals. */
    async getCommissionStatsForAdmin(from?: string, to?: string) {
        const { start, end, fromKey, toKey } = this.parseCommissionDateRange(from, to);
        const defaultCommissionPct = await this.getDefaultCommissionPct();

        const releaseEvents = await this.prisma.consignmentEscrowLedger.findMany({
            where: {
                event_type: { in: ['released', 'auto_released'] },
                created_at: { gte: start, lte: end },
            },
            include: {
                submission: {
                    select: {
                        id: true,
                        commission_pct: true,
                        expected_payout_ghs: true,
                        sale_order_id: true,
                        product_id: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });

        const releasedSubmissions = releaseEvents.map((event) => event.submission);
        const releasedContext = await this.buildFinancialContext(releasedSubmissions);
        const seenSubmissionIds = new Set<number>();
        const dailyMap = new Map<string, { commission_ghs: number; sale_volume_ghs: number; seller_payout_ghs: number; count: number }>();
        const totals = { commission_ghs: 0, sale_volume_ghs: 0, seller_payout_ghs: 0, transaction_count: 0 };

        for (const event of releaseEvents) {
            const submission = event.submission;
            if (seenSubmissionIds.has(submission.id)) continue;
            seenSubmissionIds.add(submission.id);

            const financials = this.resolveSubmissionFinancials(submission, {
                orderItem: this.pickOrderItemForSubmission(submission, releasedContext.itemsByProduct),
                payoutAmount: Number(event.amount_ghs ?? releasedContext.payoutBySubmission.get(submission.id) ?? 0),
                defaultCommissionPct: releasedContext.defaultCommissionPct,
            });
            if (financials.commission_ghs == null || financials.sale_amount_ghs == null) continue;

            const dayKey = event.created_at.toISOString().slice(0, 10);
            const day = dailyMap.get(dayKey) ?? {
                commission_ghs: 0,
                sale_volume_ghs: 0,
                seller_payout_ghs: 0,
                count: 0,
            };
            day.commission_ghs += financials.commission_ghs;
            day.sale_volume_ghs += financials.sale_amount_ghs;
            day.seller_payout_ghs += financials.seller_payout_ghs ?? 0;
            day.count += 1;
            dailyMap.set(dayKey, day);

            totals.commission_ghs += financials.commission_ghs;
            totals.sale_volume_ghs += financials.sale_amount_ghs;
            totals.seller_payout_ghs += financials.seller_payout_ghs ?? 0;
            totals.transaction_count += 1;
        }

        const pendingRows = await this.prisma.consignmentSubmission.findMany({
            where: { status: 'sold' },
            select: {
                id: true,
                commission_pct: true,
                expected_payout_ghs: true,
                sale_order_id: true,
                product_id: true,
            },
        });
        const pendingContext = await this.buildFinancialContext(pendingRows);
        const pending = { commission_ghs: 0, sale_volume_ghs: 0, seller_payout_ghs: 0, count: 0 };
        for (const submission of pendingRows) {
            const financials = this.resolveSubmissionFinancials(submission, {
                orderItem: this.pickOrderItemForSubmission(submission, pendingContext.itemsByProduct),
                payoutAmount: null,
                defaultCommissionPct: pendingContext.defaultCommissionPct,
            });
            if (financials.commission_ghs == null || financials.sale_amount_ghs == null) continue;
            pending.commission_ghs += financials.commission_ghs;
            pending.sale_volume_ghs += financials.sale_amount_ghs;
            pending.seller_payout_ghs += financials.seller_payout_ghs ?? 0;
            pending.count += 1;
        }

        const daily: Array<{
            date: string;
            commission_ghs: number;
            sale_volume_ghs: number;
            seller_payout_ghs: number;
            count: number;
        }> = [];
        const cursor = new Date(start);
        cursor.setUTCHours(0, 0, 0, 0);
        while (cursor <= end) {
            const date = cursor.toISOString().slice(0, 10);
            const row = dailyMap.get(date) ?? {
                commission_ghs: 0,
                sale_volume_ghs: 0,
                seller_payout_ghs: 0,
                count: 0,
            };
            daily.push({
                date,
                commission_ghs: Number(row.commission_ghs.toFixed(2)),
                sale_volume_ghs: Number(row.sale_volume_ghs.toFixed(2)),
                seller_payout_ghs: Number(row.seller_payout_ghs.toFixed(2)),
                count: row.count,
            });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        return {
            from: fromKey,
            to: toKey,
            default_commission_pct: defaultCommissionPct,
            totals: {
                commission_ghs: Number(totals.commission_ghs.toFixed(2)),
                sale_volume_ghs: Number(totals.sale_volume_ghs.toFixed(2)),
                seller_payout_ghs: Number(totals.seller_payout_ghs.toFixed(2)),
                transaction_count: totals.transaction_count,
            },
            pending: {
                commission_ghs: Number(pending.commission_ghs.toFixed(2)),
                sale_volume_ghs: Number(pending.sale_volume_ghs.toFixed(2)),
                seller_payout_ghs: Number(pending.seller_payout_ghs.toFixed(2)),
                count: pending.count,
            },
            daily,
        };
    }

    /** Sum of payouts awaiting delivery confirmation (not in wallet yet). */
    async getPendingEscrowSummary(userId: number) {
        const rows = await this.prisma.consignmentSubmission.findMany({
            where: { user_id: userId, status: 'sold' },
            select: {
                id: true,
                name: true,
                submission_number: true,
                expected_payout_ghs: true,
                sale_order_id: true,
                sold_at: true,
                escrow_on_hold: true,
                escrow_hold_reason: true,
            },
            orderBy: { sold_at: 'desc' },
        });
        const pending_consignment_payout_ghs = rows.reduce(
            (sum, row) => sum + Number(row.expected_payout_ghs ?? 0),
            0,
        );
        return {
            pending_consignment_payout_ghs: Number(pending_consignment_payout_ghs.toFixed(2)),
            items: rows.map((row) => ({
                id: row.id,
                name: row.name,
                submission_number: row.submission_number,
                expected_payout_ghs: Number(row.expected_payout_ghs ?? 0),
                sale_order_id: row.sale_order_id,
                sold_at: row.sold_at,
                escrow_on_hold: row.escrow_on_hold,
                escrow_hold_reason: row.escrow_hold_reason,
            })),
        };
    }

    /** Clear escrow when order is refunded before delivery payout. */
    async voidEscrowForOrder(
        orderId: number,
        tx?: Prisma.TransactionClient,
        options?: { note?: string },
    ) {
        const db = tx ?? this.prisma;
        const rows = await db.consignmentSubmission.findMany({
            where: { sale_order_id: orderId, status: 'sold' },
            select: {
                id: true,
                user_id: true,
                name: true,
                submission_number: true,
                expected_payout_ghs: true,
            },
        });
        if (!rows.length) return [];

        const run = async (client: Prisma.TransactionClient) => {
            for (const row of rows) {
                await this.recordEscrowEvent(
                    {
                        submissionId: row.id,
                        eventType: 'voided',
                        orderId,
                        amountGhs: Number(row.expected_payout_ghs ?? 0),
                        note: options?.note ?? 'Order refunded before payout release',
                    },
                    client,
                );
            }
            await client.consignmentSubmission.updateMany({
                where: { sale_order_id: orderId, status: 'sold' },
                data: {
                    status: 'sale_voided',
                    expected_payout_ghs: null,
                    sale_order_id: null,
                    sold_at: null,
                    escrow_on_hold: false,
                    escrow_hold_reason: null,
                },
            });
            return rows;
        };

        return tx ? run(tx) : this.prisma.$transaction(run);
    }

    /**
     * On order refund: void in-escrow sales and claw back post-payout credits (or queue pending clawback).
     * Call inside the order refund transaction.
     */
    async handleOrderRefundConsignment(
        orderId: number,
        orderNumber: string,
        tx: Prisma.TransactionClient,
    ) {
        const voided = await this.voidEscrowForOrder(
            orderId,
            tx,
            { note: `Order ${orderNumber} refunded` },
        );

        const orderItems = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });

        const clawbackNotices: Array<{
            userId: number;
            itemName: string;
            submissionNumber: string;
            recovered: number;
            pending: number;
        }> = [];

        for (const item of orderItems?.items ?? []) {
            const product = item.product;
            if (!product?.is_consignment || !product.consignor_user_id) continue;

            const submission = await tx.consignmentSubmission.findFirst({
                where: { product_id: product.id },
            });
            if (!submission || submission.status !== 'paid_out') continue;

            const payoutTx = await tx.walletTransaction.findFirst({
                where: {
                    user_id: product.consignor_user_id,
                    source: 'consignment_payout',
                    reference_id: submission.id,
                },
            });
            if (!payoutTx) continue;

            const toRecover = Number(payoutTx.amount_ghs);
            const available = await this.walletService.getAvailableBalanceInTx(
                product.consignor_user_id,
                tx,
            );
            const debitAmount = Math.min(available, toRecover);
            let recovered = 0;
            let pending = toRecover;

            if (debitAmount > 0) {
                await this.walletService.debit(
                    product.consignor_user_id,
                    debitAmount,
                    'other',
                    `Clawback: refund for order ${orderNumber}`,
                    submission.id,
                    tx,
                );
                recovered = debitAmount;
                pending = Math.max(0, toRecover - debitAmount);
            }

            if (pending > 0) {
                await tx.consignmentClawback.create({
                    data: {
                        consignment_submission_id: submission.id,
                        order_id: orderId,
                        consignor_user_id: product.consignor_user_id,
                        amount_ghs: pending,
                        recovered_ghs: recovered,
                        status: 'pending',
                        notes: `Refund for order ${orderNumber}; ₵${pending.toFixed(2)} outstanding`,
                    },
                });
                await this.recordEscrowEvent(
                    {
                        submissionId: submission.id,
                        eventType: 'clawback_pending',
                        orderId,
                        amountGhs: pending,
                        note: `₵${pending.toFixed(2)} clawback pending after refund`,
                    },
                    tx,
                );
            }

            await tx.consignmentSubmission.update({
                where: { id: submission.id },
                data: { status: 'sale_voided' },
            });

            clawbackNotices.push({
                userId: product.consignor_user_id,
                itemName: product.name,
                submissionNumber: submission.submission_number,
                recovered,
                pending,
            });
        }

        return { voided, clawbackNotices };
    }

    /** Escrow rows linked to an order (admin order detail). */
    async getEscrowSummaryForOrder(orderId: number) {
        const rows = await this.prisma.consignmentSubmission.findMany({
            where: {
                OR: [
                    { sale_order_id: orderId },
                    { payout_order_id: orderId },
                ],
            },
            select: {
                id: true,
                submission_number: true,
                name: true,
                status: true,
                commission_pct: true,
                expected_payout_ghs: true,
                sale_order_id: true,
                product_id: true,
                escrow_on_hold: true,
                escrow_hold_reason: true,
                user: { select: { email: true, profile: { select: { first_name: true, last_name: true } } } },
            },
        });
        const enriched = await this.attachFinancialsToSubmissions(rows);
        return enriched.map((r) => ({
            id: r.id,
            submission_number: r.submission_number,
            name: r.name,
            status: r.status,
            expected_payout_ghs: r.expected_payout_ghs != null ? Number(r.expected_payout_ghs) : null,
            sale_amount_ghs: r.sale_amount_ghs,
            commission_pct: r.commission_pct,
            commission_ghs: r.commission_ghs,
            seller_payout_ghs: r.seller_payout_ghs,
            escrow_on_hold: r.escrow_on_hold,
            escrow_hold_reason: r.escrow_hold_reason,
            consignor_email: r.user.email,
        }));
    }

    async countPendingClawbacksForAdmin() {
        return this.prisma.consignmentClawback.count({ where: { status: 'pending' } });
    }

    /** Outstanding Sell for Me clawbacks owed by a consignor (post-refund). */
    async getPendingClawbackSummary(userId: number) {
        const rows = await this.prisma.consignmentClawback.findMany({
            where: { consignor_user_id: userId, status: 'pending' },
            include: {
                submission: { select: { id: true, submission_number: true, name: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        const items = rows.map((row) => {
            const outstanding = Math.max(
                0,
                Number(row.amount_ghs) - Number(row.recovered_ghs ?? 0),
            );
            return {
                id: row.id,
                order_id: row.order_id,
                submission_id: row.consignment_submission_id,
                submission_number: row.submission.submission_number,
                item_name: row.submission.name,
                outstanding_ghs: Number(outstanding.toFixed(2)),
                recovered_ghs: Number(row.recovered_ghs ?? 0),
                notes: row.notes,
                created_at: row.created_at,
            };
        });
        const pending_clawback_ghs = Number(
            items.reduce((sum, item) => sum + item.outstanding_ghs, 0).toFixed(2),
        );
        return { pending_clawback_ghs, items };
    }

    async findClawbacksForAdmin(status?: string) {
        const where: Prisma.ConsignmentClawbackWhereInput = {};
        if (status?.trim()) where.status = status.trim() as any;
        return this.prisma.consignmentClawback.findMany({
            where,
            include: {
                submission: { select: { submission_number: true, name: true } },
                consignor: {
                    select: {
                        email: true,
                        profile: { select: { first_name: true, last_name: true } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 100,
        });
    }

    async settleClawback(
        clawbackId: number,
        adminId: number,
        action: 'recovered' | 'waived',
        note?: string,
    ) {
        const row = await this.prisma.consignmentClawback.findUnique({
            where: { id: clawbackId },
            include: { submission: { select: { submission_number: true, name: true } } },
        });
        if (!row) throw new NotFoundException('Clawback not found');
        if (row.status !== 'pending') {
            throw new BadRequestException('Clawback already settled');
        }

        if (action === 'waived') {
            const updated = await this.prisma.consignmentClawback.update({
                where: { id: clawbackId },
                data: {
                    status: 'waived',
                    notes: note?.trim() || row.notes,
                    settled_at: new Date(),
                    settled_by_admin_id: adminId,
                },
            });
            return {
                clawback: updated,
                recovered_now_ghs: 0,
                outstanding_ghs: 0,
                fully_settled: true,
            };
        }

        const outstanding = Math.max(0, Number(row.amount_ghs) - Number(row.recovered_ghs ?? 0));
        const available = await this.walletService.getAvailableBalance(row.consignor_user_id);
        const debitAmount = Math.min(available, outstanding);
        let recoveredNow = 0;

        if (debitAmount > 0) {
            await this.walletService.debit(
                row.consignor_user_id,
                debitAmount,
                'other',
                `Clawback recovery: ${row.submission.name} (order #${row.order_id})`,
                row.consignment_submission_id,
            );
            recoveredNow = debitAmount;
        }

        const newRecovered = Number(row.recovered_ghs ?? 0) + recoveredNow;
        const stillOwing = Math.max(0, Number((Number(row.amount_ghs) - newRecovered).toFixed(2)));
        const fullySettled = stillOwing <= 0;

        const updated = await this.prisma.consignmentClawback.update({
            where: { id: clawbackId },
            data: {
                status: fullySettled ? 'recovered' : 'pending',
                recovered_ghs: newRecovered,
                notes: note?.trim() || row.notes,
                ...(fullySettled
                    ? { settled_at: new Date(), settled_by_admin_id: adminId }
                    : {}),
            },
        });

        if (recoveredNow > 0 && !fullySettled) {
            await this.notificationService.createNotification({
                userId: row.consignor_user_id,
                type: 'consignment',
                title: 'Clawback partially recovered',
                message: `₵${recoveredNow.toFixed(2)} recovered toward your Sell for Me adjustment. ₵${stillOwing.toFixed(2)} still outstanding.`,
                link: '/dashboard/wallet',
            });
        }

        return {
            clawback: updated,
            recovered_now_ghs: recoveredNow,
            outstanding_ghs: stillOwing,
            fully_settled: fullySettled,
        };
    }

    /** Re-list a delisted submission on the shop. */
    async relistSubmission(id: number, adminId: number) {
        const submission = await this.findOneForAdmin(id);
        if (submission.status !== 'delisted' || !submission.product_id) {
            throw new BadRequestException('Only delisted submissions with a product can be re-listed');
        }

        const product = await this.prisma.product.findUnique({ where: { id: submission.product_id } });
        if (!product) throw new NotFoundException('Product not found');

        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: submission.product_id! },
                data: { is_active: true, stock_quantity: 1 },
            });
            return tx.consignmentSubmission.update({
                where: { id },
                data: {
                    status: 'listed',
                    reviewed_by_admin_id: adminId,
                    reviewed_at: new Date(),
                    admin_notes: submission.admin_notes
                        ? `${submission.admin_notes}\nRe-listed by admin.`
                        : 'Re-listed by admin.',
                },
                include: {
                    category: true,
                    product: { select: { id: true, slug: true, is_active: true } },
                },
            });
        });

        await this.notifyListed(
            submission.user_id,
            product.name,
            submission.submission_number,
            product.slug,
        );
        return updated;
    }

    /** Notify consignors after refund is committed. */
    async notifyAfterOrderRefund(
        orderNumber: string,
        result: {
            voided: Array<{ user_id: number; name: string; submission_number: string }>;
            clawbackNotices: Array<{
                userId: number;
                itemName: string;
                submissionNumber: string;
                recovered: number;
                pending: number;
            }>;
        },
    ) {
        for (const row of result.voided) {
            await this.notifySaleVoided(row.user_id, row.name, row.submission_number, orderNumber);
        }
        for (const notice of result.clawbackNotices) {
            if (notice.recovered > 0 || notice.pending > 0) {
                await this.notifyClawback(
                    notice.userId,
                    notice.itemName,
                    notice.submissionNumber,
                    orderNumber,
                    notice.recovered,
                    notice.pending,
                );
            }
        }
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
            message: `"${itemName}" was purchased (order ${orderNumber}). ₵ payout held until delivery is confirmed.`,
            link: '/dashboard/wallet',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Your item "${itemName}" sold (order ${orderNumber}). Payout held in escrow until delivery is confirmed.`,
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

    private async notifyEscrowHold(
        userId: number,
        itemName: string,
        submissionNumber: string,
        holdReason: string,
    ) {
        const user_name = await this.userDisplayName(userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_escrow_hold', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
                hold_reason: holdReason,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Payout on hold',
            message: `Your payout for "${itemName}" is on hold while we review a concern.`,
            link: '/dashboard/wallet',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Payout for "${itemName}" is temporarily on hold. Check your wallet for details.`,
        ).catch(() => {});
    }

    private async notifySaleVoided(
        userId: number,
        itemName: string,
        submissionNumber: string,
        orderNumber: string,
    ) {
        const user_name = await this.userDisplayName(userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_sale_voided', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
                order_number: orderNumber,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Sale cancelled',
            message: `The sale of "${itemName}" was cancelled due to a refund (order ${orderNumber}).`,
            link: '/dashboard/sell-for-me',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Sale of "${itemName}" cancelled (refund on order ${orderNumber}).`,
        ).catch(() => {});
    }

    private async notifyClawback(
        userId: number,
        itemName: string,
        submissionNumber: string,
        orderNumber: string,
        recovered: number,
        pending: number,
    ) {
        const user_name = await this.userDisplayName(userId);
        const clawback_message = pending > 0
            ? `₵${recovered.toFixed(2)} was recovered from your wallet. ₵${pending.toFixed(2)} remains outstanding.`
            : `₵${recovered.toFixed(2)} was adjusted from your wallet due to the refund.`;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_clawback', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
                order_number: orderNumber,
                clawback_message,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: pending > 0 ? 'Payout adjustment — balance due' : 'Payout adjusted',
            message: `"${itemName}" refund on order ${orderNumber}. ${clawback_message}`,
            link: '/dashboard/wallet',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Payout adjusted for "${itemName}" (order ${orderNumber} refunded).`,
        ).catch(() => {});
    }

    private async notifyEscrowHoldReleased(userId: number, itemName: string, submissionNumber: string) {
        const user_name = await this.userDisplayName(userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.emailTemplateService.queueFromTemplate('consignment_escrow_hold_released', user.email, {
                user_name,
                item_name: itemName,
                submission_number: submissionNumber,
            });
        }
        await this.notificationService.createNotification({
            userId,
            type: 'consignment',
            title: 'Hold released',
            message: `The hold on your payout for "${itemName}" was released.`,
            link: '/dashboard/wallet',
        });
        this.smsService.sendToUser(
            userId,
            `ThinQShop: Hold released on "${itemName}". Payout after delivery confirmation.`,
        ).catch(() => {});
    }

    private async recordEscrowEvent(
        data: {
            submissionId: number;
            eventType: ConsignmentEscrowEvent;
            orderId?: number | null;
            amountGhs?: number | null;
            note?: string | null;
            actorUserId?: number | null;
        },
        tx?: Prisma.TransactionClient,
    ) {
        const client = tx ?? this.prisma;
        await client.consignmentEscrowLedger.create({
            data: {
                consignment_submission_id: data.submissionId,
                order_id: data.orderId ?? null,
                event_type: data.eventType,
                amount_ghs: data.amountGhs ?? null,
                note: data.note ?? null,
                actor_user_id: data.actorUserId ?? null,
            },
        });
    }

    async getEscrowLedgerForSubmission(submissionId: number, userId?: number) {
        const submission = userId
            ? await this.prisma.consignmentSubmission.findFirst({
                where: { id: submissionId, user_id: userId },
                select: { id: true },
            })
            : await this.prisma.consignmentSubmission.findUnique({
                where: { id: submissionId },
                select: { id: true },
            });
        if (!submission) throw new NotFoundException('Submission not found');

        return this.prisma.consignmentEscrowLedger.findMany({
            where: { consignment_submission_id: submissionId },
            orderBy: { created_at: 'asc' },
        });
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
        const rows = await this.prisma.consignmentSubmission.findMany({
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
        return this.attachFinancialsToSubmissions(rows);
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
        const [enriched] = await this.attachFinancialsToSubmissions([row]);
        return enriched;
    }

    async updateUserSubmission(userId: number, id: number, dto: Partial<CreateConsignmentSubmissionDto>) {
        const row = await this.findUserSubmission(userId, id);
        if (row.status !== 'changes_requested') {
            throw new BadRequestException('Only submissions awaiting changes can be updated');
        }

        if (dto.category_id !== undefined) {
            const category = await this.prisma.category.findFirst({
                where: { id: dto.category_id, is_active: true },
            });
            if (!category) throw new BadRequestException('Invalid category');
        }

        const specs: Record<string, unknown> = {
            ...(typeof row.specifications === 'object' && row.specifications !== null ? row.specifications as Record<string, unknown> : {}),
            ...(dto.specifications ?? {}),
        };
        if (dto.condition) specs.condition = dto.condition;
        if (dto.brand?.trim()) specs.brand = dto.brand.trim();
        if (dto.model?.trim()) specs.model = dto.model.trim();
        if (dto.serial_number?.trim()) specs.serial_number = dto.serial_number.trim();

        return this.prisma.consignmentSubmission.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
                ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
                ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
                ...(dto.short_description !== undefined ? { short_description: dto.short_description?.trim() || null } : {}),
                ...(dto.asking_price !== undefined ? { asking_price: dto.asking_price } : {}),
                ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
                ...(dto.images !== undefined ? { images: dto.images } : {}),
                ...(dto.pickup_details !== undefined ? { pickup_details: dto.pickup_details.trim() } : {}),
                specifications: specs as Prisma.InputJsonValue,
                status: 'submitted',
                admin_notes: null,
            },
            include: { category: true, product: { select: { id: true, slug: true, is_active: true } } },
        });
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

    /** Take a live listing offline without rejecting the submission. */
    async delistSubmission(id: number, adminId: number, reason?: string) {
        const submission = await this.findOneForAdmin(id);
        if (submission.status !== 'listed' || !submission.product_id) {
            throw new BadRequestException('Only live shop listings can be delisted');
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: submission.product_id! },
                data: { is_active: false, stock_quantity: 0 },
            });
            return tx.consignmentSubmission.update({
                where: { id },
                data: {
                    status: 'delisted',
                    admin_notes: reason?.trim() || submission.admin_notes || 'Delisted by admin',
                    reviewed_by_admin_id: adminId,
                    reviewed_at: new Date(),
                },
                include: {
                    category: true,
                    product: { select: { id: true, slug: true, is_active: true } },
                    user: { select: { id: true, email: true } },
                },
            });
        }).then(async (updated) => {
            await this.notificationService.createNotification({
                userId: submission.user_id,
                type: 'consignment',
                title: 'Listing taken offline',
                message: `"${submission.name}" was removed from the shop by our team.`,
                link: '/dashboard/sell-for-me',
            });
            return updated;
        });
    }

    async countPendingForAdmin() {
        return this.prisma.consignmentSubmission.count({
            where: { status: { in: ['submitted', 'under_review'] } },
        });
    }

    async countEscrowPendingForAdmin() {
        return this.prisma.consignmentSubmission.count({
            where: { status: 'sold' },
        });
    }

    /** Phase 1 — admin queue: consignment sales awaiting delivery / payout release. */
    async findEscrowQueueForAdmin(query?: {
        page?: number;
        limit?: number;
        hold_only?: boolean;
        search?: string;
        order_status?: string;
    }) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query?.limit) || 25));
        const skip = (page - 1) * limit;

        const where: Prisma.ConsignmentSubmissionWhereInput = { status: 'sold' };
        if (query?.hold_only) where.escrow_on_hold = true;

        const search = query?.search?.trim();
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { submission_number: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (query?.order_status?.trim()) {
            const matchingOrders = await this.prisma.order.findMany({
                where: { status: query.order_status.trim() as any },
                select: { id: true },
            });
            const orderIds = matchingOrders.map((o) => o.id);
            where.sale_order_id = orderIds.length ? { in: orderIds } : { in: [] };
        }

        const [rows, total, heldCount, payoutAgg] = await Promise.all([
            this.prisma.consignmentSubmission.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            profile: { select: { first_name: true, last_name: true } },
                        },
                    },
                    product: { select: { id: true, slug: true, name: true } },
                },
                orderBy: { sold_at: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.consignmentSubmission.count({ where }),
            this.prisma.consignmentSubmission.count({ where: { status: 'sold', escrow_on_hold: true } }),
            this.prisma.consignmentSubmission.aggregate({
                where: { status: 'sold' },
                _sum: { expected_payout_ghs: true },
            }),
        ]);

        const orderIds = [...new Set(rows.map((r) => r.sale_order_id).filter((id): id is number => id != null))];
        const orders = orderIds.length
            ? await this.prisma.order.findMany({
                where: { id: { in: orderIds } },
                select: {
                    id: true,
                    order_number: true,
                    status: true,
                    payment_status: true,
                    updated_at: true,
                    tracking: { select: { status: true, created_at: true }, orderBy: { created_at: 'asc' } },
                },
            })
            : [];
        const orderMap = new Map(orders.map((o) => [o.id, o]));

        const items = rows.map((row) => ({
            id: row.id,
            submission_number: row.submission_number,
            name: row.name,
            expected_payout_ghs: Number(row.expected_payout_ghs ?? 0),
            sold_at: row.sold_at,
            sale_order_id: row.sale_order_id,
            escrow_on_hold: row.escrow_on_hold,
            escrow_hold_reason: row.escrow_hold_reason,
            user: row.user,
            product: row.product,
            order: row.sale_order_id ? orderMap.get(row.sale_order_id) ?? null : null,
        }));

        return {
            items,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
            summary: {
                total_in_escrow_ghs: Number(payoutAgg._sum.expected_payout_ghs ?? 0),
                held_count: heldCount,
            },
        };
    }

    /** Phase 2 — pause payout until dispute resolved. */
    async setEscrowHold(submissionId: number, adminId: number, reason: string) {
        const submission = await this.findOneForAdmin(submissionId);
        if (submission.status !== 'sold') {
            throw new BadRequestException('Only sold listings in escrow can be placed on hold');
        }
        const holdReason = reason?.trim();
        if (!holdReason) throw new BadRequestException('Hold reason is required');

        const updated = await this.prisma.consignmentSubmission.update({
            where: { id: submissionId },
            data: {
                escrow_on_hold: true,
                escrow_hold_reason: holdReason,
                reviewed_by_admin_id: adminId,
                reviewed_at: new Date(),
            },
        });

        await this.recordEscrowEvent({
            submissionId,
            eventType: 'hold_placed',
            orderId: submission.sale_order_id,
            amountGhs: Number(submission.expected_payout_ghs ?? 0),
            note: holdReason,
            actorUserId: adminId,
        });

        await this.notifyEscrowHold(
            submission.user_id,
            submission.name,
            submission.submission_number,
            holdReason,
        );

        return updated;
    }

    async releaseEscrowHold(submissionId: number, adminId: number) {
        const submission = await this.findOneForAdmin(submissionId);
        if (submission.status !== 'sold') {
            throw new BadRequestException('Submission is not in escrow');
        }
        if (!submission.escrow_on_hold) {
            throw new BadRequestException('Escrow is not on hold');
        }

        const updated = await this.prisma.consignmentSubmission.update({
            where: { id: submissionId },
            data: {
                escrow_on_hold: false,
                escrow_hold_reason: null,
                reviewed_by_admin_id: adminId,
                reviewed_at: new Date(),
            },
        });

        await this.recordEscrowEvent({
            submissionId,
            eventType: 'hold_released',
            orderId: submission.sale_order_id,
            amountGhs: Number(submission.expected_payout_ghs ?? 0),
            note: 'Dispute hold released by admin',
            actorUserId: adminId,
        });

        await this.notifyEscrowHoldReleased(
            submission.user_id,
            submission.name,
            submission.submission_number,
        );

        return updated;
    }

    /**
     * Phase 3 — optional auto-release: mark delivered (and pay seller) when shipped X+ days ago.
     * Disabled when auto_release_days_after_shipped is 0. Skips escrow_on_hold rows.
     */
    async processAutoEscrowReleases(options?: { source?: 'manual' | 'cron' }) {
        const settings = await this.getAdminSettings();
        const minDays = settings.auto_release_days_after_shipped ?? 0;
        if (!minDays || minDays < 1) {
            return { processed: 0, eligible: 0, message: 'Auto-release is disabled (set days in Sell for Me settings)' };
        }

        const rows = await this.prisma.consignmentSubmission.findMany({
            where: { status: 'sold', escrow_on_hold: false },
            select: { id: true, sale_order_id: true },
        });

        let eligible = 0;
        let processed = 0;
        const processedOrderIds = new Set<number>();

        for (const row of rows) {
            if (!row.sale_order_id || processedOrderIds.has(row.sale_order_id)) continue;

            const order = await this.prisma.order.findUnique({
                where: { id: row.sale_order_id },
                include: { tracking: { orderBy: { created_at: 'asc' } } },
            });
            if (!order || order.payment_status !== 'success') continue;
            if (!['shipped', 'out_for_delivery'].includes(order.status)) continue;

            const shipEvent = order.tracking.find(
                (t) => t.status === 'shipped' || t.status === 'out_for_delivery',
            );
            const anchor = shipEvent?.created_at ?? order.updated_at;
            const daysSinceShip = (Date.now() - anchor.getTime()) / 86_400_000;
            if (daysSinceShip < minDays) continue;

            eligible += 1;
            try {
                await this.orderService.updateOrderStatus(order.id, 'delivered', {
                    consignmentReleaseNote: `Auto-released after ${minDays} day(s) shipped`,
                    consignmentReleaseEvent: 'auto_released',
                });
                processedOrderIds.add(order.id);
                processed += 1;
            } catch {
                // skip failed row; admin can deliver manually
            }
        }

        const sourceLabel = options?.source === 'cron' ? 'scheduled' : 'manual';
        return {
            processed,
            eligible,
            message: processed > 0
                ? `Released ${processed} escrow payout(s) via ${sourceLabel} auto-deliver`
                : 'No eligible orders met the auto-release criteria',
        };
    }

    /** When order is paid — mark sold and lock expected payout in escrow (wallet credited on delivery). */
    async handleOrderPaid(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });
        if (!order || order.payment_status !== 'success') return;

        for (const item of order.items) {
            const product = item.product;
            if (!product?.is_consignment) continue;

            const submission = await this.prisma.consignmentSubmission.findFirst({
                where: { product_id: product.id, status: 'listed' },
            });
            if (!submission) continue;

            const commissionPct = Number(
                submission.commission_pct ?? product.commission_pct ?? FALLBACK_COMMISSION_PCT,
            );
            const expectedPayout = this.computeExpectedPayout(Number(item.total), commissionPct);

            await this.prisma.product.updateMany({
                where: { id: product.id },
                data: { stock_quantity: 0, is_active: false },
            });

            const sold = await this.prisma.consignmentSubmission.updateMany({
                where: { id: submission.id, status: 'listed' },
                data: {
                    status: 'sold',
                    sale_order_id: orderId,
                    expected_payout_ghs: expectedPayout,
                    sold_at: new Date(),
                },
            });
            if (sold.count > 0 && product.consignor_user_id) {
                await this.recordEscrowEvent({
                    submissionId: submission.id,
                    eventType: 'locked',
                    orderId,
                    amountGhs: expectedPayout,
                    note: `Escrow locked on sale (order ${order.order_number})`,
                });
                await this.notifySold(
                    product.consignor_user_id,
                    product.name,
                    order.order_number,
                );
            }
        }
    }

    /** When order is delivered — release escrow into withdrawable wallet balance. */
    async handleOrderDelivered(
        orderId: number,
        options?: { releaseNote?: string; releaseEvent?: 'released' | 'auto_released' },
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });
        if (!order || order.payment_status !== 'success') return;

        for (const item of order.items) {
            const product = item.product;
            if (!product?.is_consignment || !product.consignor_user_id) continue;

            const submission = await this.prisma.consignmentSubmission.findFirst({
                where: { product_id: product.id },
            });
            if (!submission || submission.status !== 'sold') continue;
            if (submission.escrow_on_hold) continue;

            const saleAmount = Number(item.total);
            const commissionPct = Number(submission.commission_pct ?? product.commission_pct ?? FALLBACK_COMMISSION_PCT);
            const calculated = this.computeExpectedPayout(saleAmount, commissionPct);
            const payout = Number(submission.expected_payout_ghs ?? calculated);

            let shouldNotify = false;
            let notifyAmount = 0;

            await this.prisma.$transaction(async (tx) => {
                const transitioned = await tx.consignmentSubmission.updateMany({
                    where: { id: submission.id, status: 'sold' },
                    data: {
                        status: 'paid_out',
                        payout_order_id: orderId,
                        expected_payout_ghs: null,
                    },
                });
                if (transitioned.count === 0) return;

                const existingLedger = await tx.walletTransaction.findFirst({
                    where: {
                        user_id: product.consignor_user_id!,
                        source: 'consignment_payout',
                        reference_id: submission.id,
                    },
                });
                if (existingLedger) return;

                if (payout > 0) {
                    await this.walletService.credit(
                        product.consignor_user_id!,
                        payout,
                        'consignment_payout',
                        `Sell for Me payout: ${product.name} (${submission.submission_number})`,
                        submission.id,
                        tx,
                    );
                }

                await this.recordEscrowEvent(
                    {
                        submissionId: submission.id,
                        eventType: options?.releaseEvent ?? 'released',
                        orderId,
                        amountGhs: payout,
                        note: options?.releaseNote ?? 'Payout released on order delivery',
                    },
                    tx,
                );

                shouldNotify = true;
                notifyAmount = payout;
            });

            if (shouldNotify && notifyAmount > 0) {
                await this.notifyPayout(
                    product.consignor_user_id!,
                    product.name,
                    submission.submission_number,
                    notifyAmount,
                );
            }
        }
    }
}
