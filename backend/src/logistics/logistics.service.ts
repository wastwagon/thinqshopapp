import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../finance/wallet.service';
import { ShipmentStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class LogisticsService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WalletService))
        private walletService: WalletService,
        private notificationService: NotificationService,
        private smsService: SmsService,
    ) { }

    async onModuleInit() {
        await this.ensureWarehouses();
    }

    /** Ensures China + Lapaz warehouses exist (Ship for Me flow). Idempotent — safe on every startup. */
    private async ensureWarehouses() {
        const essential = [
            { code: 'CN-GZ-001', name: 'ThinQ China Hub', address: '广州市越秀区三元里大道499-523号四楼08号商铺', city: 'Guangzhou', country: 'China', phone: '18320709024', recipient_name: 'ThinQ China Team', is_active: true },
            { code: 'GH-LAPAZ-001', name: 'Lapaz Hub', address: 'Lapaz Main Road, Opposite Las Palmas, Accra', city: 'Accra', country: 'Ghana', phone: '+233 24 000 0000', recipient_name: 'ThinQ Lapaz Team', is_active: true },
        ];
        for (const w of essential) {
            await this.prisma.warehouse.upsert({
                where: { code: w.code },
                update: w,
                create: w,
            });
        }
    }

    async getWarehouses() {
        return this.prisma.warehouse.findMany({
            where: { is_active: true }
        });
    }

    // ... (rest of the file)

    async getAllShipments() {
        return this.prisma.shipment.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                },
                origin_warehouse: true,
                destination_warehouse: true
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getAdminShipmentById(id: number) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        profile: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                },
                tracking: { orderBy: { created_at: 'desc' } },
                pickup_address: true,
                delivery_address: true,
                origin_warehouse: true,
                destination_warehouse: true
            },
        });
        if (!shipment) throw new NotFoundException('Shipment not found');
        return shipment;
    }

    async updateShipmentStatus(id: number, status: ShipmentStatus, notes?: string) {
        const shipment = await this.prisma.shipment.update({
            where: { id },
            data: {
                status,
                tracking: {
                    create: {
                        status: status,
                        notes: notes || `Status updated to ${status}`,
                        location: 'Operations Center',
                    }
                }
            }
        });

        const statusMap: any = {
            'in_transit': 'Departed Origin Node',
            'out_for_delivery': 'Dispatched for Final Node',
            'delivered': 'Transfer Protocol Complete',
            'picked_up': 'Intake Protocol Complete'
        };

        const humanStatus = statusMap[status] || 'Updated';

        await this.notificationService.createNotification({
            userId: shipment.user_id,
            type: 'logistics',
            title: `Shipment ${shipment.tracking_number} ${humanStatus}`,
            message: notes || `Your shipment has advanced to ${status}. Log in to view realtime data.`,
            link: `/dashboard/logistics`
        });

        this.smsService.sendToUser(shipment.user_id, `ThinQShop: Shipment ${shipment.tracking_number} - ${humanStatus}. ${notes || 'Track at ThinQShop.'}`).catch(() => {});

        return shipment;
    }

    async calculatePrice(params: { weight: number, zoneId: number, serviceType: string }) {
        const { weight, zoneId, serviceType } = params;
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id: zoneId }
        });

        if (!zone) throw new BadRequestException('Invalid shipping zone');

        const basePrice = Number(zone.base_price);
        const weightPrice = Number(zone.per_kg_price) * weight;
        let totalCalculatedPrice = basePrice + weightPrice;
        let servicePrice = 0;

        // Service multipliers
        if (serviceType === 'next_day') {
            // 50% surcharge on total
            servicePrice = totalCalculatedPrice * 0.5;
            totalCalculatedPrice += servicePrice;
        } else if (serviceType === 'same_day') {
            // 100% surcharge on total
            servicePrice = totalCalculatedPrice * 1.0;
            totalCalculatedPrice += servicePrice;
        }

        const roundToTwoDecimals = (num: number) => Math.ceil(num * 100) / 100;

        return {
            base: roundToTwoDecimals(basePrice),
            weightInfo: roundToTwoDecimals(weightPrice),
            service: roundToTwoDecimals(servicePrice),
            total: roundToTwoDecimals(totalCalculatedPrice)
        };
    }

    async bookShipment(userId: number, dto: any) {
        const {
            pickup_address_id,
            delivery_address_id,
            weight,
            zoneId,
            service_type,
            payment_method,
            dimensions,
            pickup_date,
            pickup_time_slot,
            notes,
            contents_description
        } = dto;

        const isFreightForwarding = dto.type === 'freight_forwarding';

        let priceDetails = { base: 0, weightInfo: 0, service: 0, total: 0 };

        if (!isFreightForwarding) {
            // Courier: Validate and Charge
            if (!pickup_address_id || !delivery_address_id || !weight || !zoneId || !service_type || !payment_method) {
                throw new BadRequestException('Missing required shipment details.');
            }
            // Calculate Price
            priceDetails = await this.calculatePrice({ weight, zoneId: Number(zoneId), serviceType: service_type });

            // Payment Logic (Immediate for Courier)
            if (payment_method === 'wallet') {
                const wallet = await this.walletService.getBalance(userId);
                if (!wallet || Number(wallet.balance_ghs) < priceDetails.total) {
                    throw new BadRequestException('Insufficient wallet balance');
                }
                await this.walletService.topUp(userId, -priceDetails.total);
            }
        } else {
            // Freight Forwarding: Local pickup at destination warehouse (no delivery address needed)
            if (!dto.carrier_tracking_number) {
                throw new BadRequestException('Missing required freight details.');
            }
            // Price is TBD upon arrival
            priceDetails.total = 0;
        }

        const tracking_number = `SHP-${Date.now()}`;

        return this.prisma.shipment.create({
            data: {
                user_id: userId,
                tracking_number,
                pickup_address_id: dto.origin_warehouse_id ? null : pickup_address_id,
                delivery_address_id: isFreightForwarding ? null : delivery_address_id,
                weight: weight || 0,
                dimensions: dimensions || '',
                service_type: isFreightForwarding ? 'standard' : service_type,
                status: 'booked',
                payment_method: payment_method || 'wallet',
                payment_status: isFreightForwarding ? 'pending' : (payment_method === 'wallet' ? 'success' : 'pending'),
                base_price: priceDetails.base,
                weight_price: priceDetails.weightInfo,
                service_price: priceDetails.service,
                total_price: priceDetails.total,
                pickup_date: pickup_date ? new Date(pickup_date) : null,
                pickup_time_slot,
                notes: `${notes || ''} [Contents: ${contents_description || 'N/A'}]`,
                origin_warehouse_id: dto.origin_warehouse_id ? Number(dto.origin_warehouse_id) : null,
                destination_warehouse_id: dto.destination_warehouse_id ? Number(dto.destination_warehouse_id) : null,
                items_declaration: dto.items_declaration || [],
                carrier_tracking_number: dto.carrier_tracking_number,
                shipping_method: isFreightForwarding ? dto.shipping_method : null,
                shipping_rate_id: isFreightForwarding ? (dto.shipping_rate_id || null) : null,
                is_cod: dto.is_cod || false,
            }
        });
    }

    async getShipmentById(userId: number, id: number) {
        const shipment = await this.prisma.shipment.findFirst({
            where: { id, user_id: userId },
            include: {
                tracking: { orderBy: { created_at: 'desc' } },
                pickup_address: true,
                delivery_address: true,
                origin_warehouse: true,
                destination_warehouse: true,
            },
        });
        if (!shipment) throw new NotFoundException('Shipment not found');
        return shipment;
    }

    async trackShipment(trackingNumber: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { tracking_number: trackingNumber },
            include: {
                tracking: { orderBy: { created_at: 'desc' } },
                pickup_address: true,
                delivery_address: true
            },
        });
        if (!shipment) throw new NotFoundException('Shipment not found');
        return shipment;
    }

    async getZones() {
        return this.prisma.shippingZone.findMany({
            where: { is_active: true },
        });
    }

    async getFreightRates(method?: 'air_freight' | 'sea_freight') {
        const where: any = { is_active: true };
        if (method) where.method = method;
        return this.prisma.shippingMethodRate.findMany({
            where,
            orderBy: [{ method: 'asc' }, { sort_order: 'asc' }, { id: 'asc' }],
        });
    }

    async getAllFreightRates() {
        return this.prisma.shippingMethodRate.findMany({
            orderBy: [{ method: 'asc' }, { sort_order: 'asc' }, { id: 'asc' }],
        });
    }

    async createFreightRate(dto: { rate_id: string; method: string; name: string; price: number; type: string; duration?: string; currency?: string; is_active?: boolean; sort_order?: number }) {
        const existing = await this.prisma.shippingMethodRate.findUnique({ where: { rate_id: dto.rate_id } });
        if (existing) throw new BadRequestException(`Rate ID "${dto.rate_id}" already exists`);
        if (!['air_freight', 'sea_freight'].includes(dto.method)) throw new BadRequestException('method must be air_freight or sea_freight');
        if (!['KG', 'UNIT', 'CBM'].includes(dto.type)) throw new BadRequestException('type must be KG, UNIT, or CBM');
        return this.prisma.shippingMethodRate.create({
            data: {
                rate_id: dto.rate_id.trim(),
                method: dto.method,
                name: dto.name.trim(),
                price: dto.price,
                type: dto.type,
                duration: dto.duration?.trim() || null,
                currency: dto.currency || 'USD',
                is_active: dto.is_active ?? true,
                sort_order: dto.sort_order ?? 0,
            },
        });
    }

    async updateFreightRate(id: number, dto: Partial<{ rate_id: string; method: string; name: string; price: number; type: string; duration: string; currency: string; is_active: boolean; sort_order: number }>) {
        const rate = await this.prisma.shippingMethodRate.findUnique({ where: { id } });
        if (!rate) throw new NotFoundException('Shipping rate not found');
        if (dto.rate_id != null && dto.rate_id !== rate.rate_id) {
            const existing = await this.prisma.shippingMethodRate.findUnique({ where: { rate_id: dto.rate_id } });
            if (existing) throw new BadRequestException(`Rate ID "${dto.rate_id}" already exists`);
        }
        if (dto.method != null && !['air_freight', 'sea_freight'].includes(dto.method)) throw new BadRequestException('method must be air_freight or sea_freight');
        if (dto.type != null && !['KG', 'UNIT', 'CBM'].includes(dto.type)) throw new BadRequestException('type must be KG, UNIT, or CBM');
        const data: any = {};
        if (dto.rate_id != null) data.rate_id = dto.rate_id.trim();
        if (dto.method != null) data.method = dto.method;
        if (dto.name != null) data.name = dto.name.trim();
        if (dto.price != null) data.price = dto.price;
        if (dto.type != null) data.type = dto.type;
        if (dto.duration !== undefined) data.duration = dto.duration?.trim() || null;
        if (dto.currency !== undefined) data.currency = dto.currency || 'USD';
        if (dto.is_active !== undefined) data.is_active = dto.is_active;
        if (dto.sort_order != null) data.sort_order = dto.sort_order;
        return this.prisma.shippingMethodRate.update({ where: { id }, data });
    }

    async deleteFreightRate(id: number) {
        const rate = await this.prisma.shippingMethodRate.findUnique({ where: { id } });
        if (!rate) throw new NotFoundException('Shipping rate not found');
        return this.prisma.shippingMethodRate.delete({ where: { id } });
    }

    async getUserShipments(userId: number) {
        return this.prisma.shipment.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
    }

    async simulateWebhookAdvance(id: number) {
        const shipment = await this.prisma.shipment.findUnique({ where: { id } });
        if (!shipment) throw new NotFoundException('Shipment not found');

        let nextStatus: any = 'in_transit';
        let note = 'Package scanned at origin facility.';

        switch (shipment.status) {
            case 'booked':
                nextStatus = 'in_transit';
                note = 'Package departed origin facility and is in transit.';
                break;
            case 'in_transit':
                nextStatus = 'out_for_delivery';
                note = 'Package has arrived at final hub and is out for delivery.';
                break;
            case 'out_for_delivery':
                nextStatus = 'delivered';
                note = 'Package successfully delivered and signed for.';
                break;
            case 'delivered':
                return { message: 'Shipment is already delivered.' };
            default:
                nextStatus = 'in_transit';
        }

        return this.updateShipmentStatus(id, nextStatus, note);
    }
}

