import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { LogisticsService } from '../logistics/logistics.service';
import { TransferService } from '../finance/transfer.service';
import { ProcurementService } from '../procurement/procurement.service';

export type TrackResultType = 'order' | 'shipment' | 'transfer' | 'procurement_request' | 'procurement_order';

export interface TrackResult {
    type: TrackResultType;
    reference: string;
    status: string;
    label: string;
    created_at: string;
    data: Record<string, unknown>;
    timeline?: Array<{ date: string; status: string; notes?: string; location?: string }>;
}

function toIso(d: Date | string | undefined): string {
    if (!d) return '';
    return typeof d === 'string' ? d : (d as Date).toISOString?.() ?? String(d);
}

@Injectable()
export class TrackService {
    constructor(
        private orderService: OrderService,
        private logisticsService: LogisticsService,
        private transferService: TransferService,
        private procurementService: ProcurementService,
    ) {}

    async track(reference: string): Promise<TrackResult> {
        const trimmed = reference?.trim();
        if (!trimmed) throw new NotFoundException('Please enter a tracking or order number');

        const upper = trimmed.toUpperCase();

        // Route by prefix - try specific service first
        if (upper.startsWith('ORD-')) {
            const r = await this.trackOrder(trimmed);
            if (!r) throw new NotFoundException('Order not found');
            return r;
        }
        if (upper.startsWith('SHP-')) {
            const r = await this.trackShipment(trimmed);
            if (!r) throw new NotFoundException('Shipment not found');
            return r;
        }
        if (upper.startsWith('TRF-')) {
            const r = await this.trackTransfer(trimmed);
            if (!r) throw new NotFoundException('Transfer not found');
            return r;
        }
        if (upper.startsWith('PRQ-')) {
            const r = await this.trackProcurementRequest(trimmed);
            if (!r) throw new NotFoundException('Procurement request not found');
            return r;
        }
        if (upper.startsWith('POR-')) {
            const r = await this.trackProcurementOrder(trimmed);
            if (!r) throw new NotFoundException('Procurement order not found');
            return r;
        }

        // No recognized prefix: try each in sequence (best-effort)
        const results = await Promise.allSettled([
            this.trackOrder(trimmed),
            this.trackShipment(trimmed),
            this.trackTransfer(trimmed),
            this.trackProcurementRequest(trimmed),
            this.trackProcurementOrder(trimmed),
        ]);

        for (const r of results) {
            if (r.status === 'fulfilled') return r.value;
        }

        throw new NotFoundException('Tracking ID not found. Please verify and try again.');
    }

    private async trackOrder(ref: string): Promise<TrackResult> {
        const order = await this.orderService.findOneByOrderNumber(ref);
        if (!order) return null as any;

        const history = Array.isArray((order as any).tracking) ? (order as any).tracking : [];
        const timeline = history.length > 0
            ? history.map((e: any) => ({
                date: toIso(e.created_at),
                status: e.status?.replace(/_/g, ' ') || e.status,
                notes: e.notes,
            }))
            : [{
                date: toIso(order.created_at as any),
                status: order.status?.replace(/_/g, ' ') || 'Placed',
            }];

        return {
            type: 'order',
            reference: order.order_number,
            status: order.status,
            label: 'E-commerce Order',
            created_at: toIso(order.created_at as any),
            data: {
                total: Number(order.total),
                items_count: order.items_count,
                payment_method: order.payment_method,
                shipping_region: order.shipping_region,
                items: order.items,
            },
            timeline,
        };
    }

    private async trackShipment(ref: string): Promise<TrackResult> {
        try {
            const shipment = await this.logisticsService.trackShipment(ref);
            const publicShipment = this.logisticsService.toPublicTrack(shipment);
            const timeline = (publicShipment.tracking || []).map((e) => ({
                date: toIso(e.created_at),
                status: e.status,
                notes: e.notes ?? undefined,
                location: e.location ?? undefined,
            }));

            if (timeline.length === 0 && publicShipment.created_at) {
                timeline.push({
                    date: toIso(publicShipment.created_at as Date),
                    status: 'Booked',
                    notes: 'Your package is being prepared.',
                    location: undefined,
                });
            }

            return {
                type: 'shipment',
                reference: publicShipment.tracking_number,
                status: publicShipment.status,
                label: 'Logistics Shipment',
                created_at: toIso(publicShipment.created_at as Date),
                data: {
                    carrier_tracking_number: publicShipment.carrier_tracking_number,
                },
                timeline,
            };
        } catch {
            return null as any;
        }
    }

    private async trackTransfer(ref: string): Promise<TrackResult> {
        const transfer = await this.transferService.getTransferByToken(ref);
        if (!transfer) return null as any;
        const publicTransfer = this.transferService.toPublicTrack(transfer);

        const timeline = (publicTransfer.tracking || []).map((e) => ({
            date: toIso(e.created_at),
            status: e.status,
            notes: e.notes ?? undefined,
        }));

        return {
            type: 'transfer',
            reference: publicTransfer.token,
            status: publicTransfer.status,
            label: 'Money Transfer',
            created_at: toIso(publicTransfer.created_at as Date),
            data: {
                amount_ghs: publicTransfer.amount_ghs,
                transfer_direction: publicTransfer.transfer_type,
                status: publicTransfer.status,
            },
            timeline: timeline.length > 0 ? timeline : [{ date: toIso(publicTransfer.created_at as Date), status: publicTransfer.status }],
        };
    }

    private async trackProcurementRequest(ref: string): Promise<TrackResult> {
        const req = await this.procurementService.findRequest(ref);
        if (!req) return null as any;

        const timeline = [];
        timeline.push({ date: toIso(req.created_at as any), status: req.status });

        return {
            type: 'procurement_request',
            reference: req.request_number,
            status: req.status,
            label: 'Procurement Request',
            created_at: toIso(req.created_at as any),
            data: {
                status: req.status,
                quotes_count: req.quotes?.length ?? 0,
            },
            timeline,
        };
    }

    private async trackProcurementOrder(ref: string): Promise<TrackResult> {
        const order = await this.procurementService.findOrderByOrderNumber(ref);
        if (!order) return null as any;

        const timeline = (order.tracking || []).map((e: any) => ({
            date: toIso(e.created_at),
            status: e.status,
            notes: e.notes,
        }));

        if (timeline.length === 0) {
            timeline.push({ date: toIso(order.created_at as any), status: order.status, notes: undefined });
        }

        return {
            type: 'procurement_order',
            reference: order.order_number,
            status: order.status,
            label: 'Procurement Order',
            created_at: toIso(order.created_at as any),
            data: {
                amount: Number(order.amount),
                request_number: order.request_number,
            },
            timeline,
        };
    }
}
