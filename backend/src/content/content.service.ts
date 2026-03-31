import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const FXR_API_BASE = 'https://dev.kwayisi.org/apis/forex';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { CreateTrustBadgeDto, UpdateTrustBadgeDto } from './dto/trust-badge.dto';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { UpdatePolicyDto } from './dto/policy.dto';
import { UpdateHomepageSectionDto, ReorderSectionsDto } from './dto/homepage-section.dto';
import { UpdateStorefrontSettingsDto } from './dto/settings.dto';

@Injectable()
export class ContentService {
    constructor(private prisma: PrismaService) {}

    // --- Public (storefront) ---

    getHeroSlides() {
        return this.prisma.heroSlide.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' },
        });
    }

    getTrustBadges() {
        return this.prisma.trustBadge.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' },
        });
    }

    getTestimonials() {
        return this.prisma.testimonial.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' },
        });
    }

    getPolicies() {
        return this.prisma.sitePolicy.findMany({
            orderBy: { type: 'asc' },
        });
    }

    getHomepageSections() {
        return this.prisma.homepageSection.findMany({
            where: { is_enabled: true },
            orderBy: { sort_order: 'asc' },
        });
    }

    getPublicSettings() {
        const keys = [
            'free_shipping_threshold_ghs',
            'standard_shipping_fee_ghs',
            'site_orders_delivered_text',
            'support_phone',
            'support_email',
        ];
        return this.prisma.setting.findMany({
            where: { setting_key: { in: keys } },
        }).then(rows => {
            const map: Record<string, string> = {};
            rows.forEach(r => { map[r.setting_key] = r.setting_value ?? ''; });
            return map;
        });
    }

    /** Store a newsletter signup; duplicate emails return ok without error (privacy). */
    async subscribeNewsletter(email: string): Promise<{ ok: true }> {
        const normalized = email.trim().toLowerCase();
        try {
            await this.prisma.newsletterSignup.create({ data: { email: normalized } });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                return { ok: true };
            }
            throw e;
        }
        return { ok: true };
    }

    /** Shop display rates (GHS→USD, GHS→CNY). Fetches from FXR-API if stale; falls back to last stored. */
    async getCurrencyRates(): Promise<{ ghs_to_usd: number; ghs_to_cny: number } | null> {
        const latest = await this.prisma.shopCurrencyRate.findFirst({
            orderBy: { fetched_at: 'desc' },
        });
        const now = Date.now();
        const isStale = !latest || (now - latest.fetched_at.getTime()) > CACHE_MAX_AGE_MS;
        if (isStale) {
            const fetched = await this.fetchAndStoreRatesFromFxr();
            if (fetched) return fetched;
        }
        if (latest) {
            return {
                ghs_to_usd: Number(latest.rate_ghs_to_usd),
                ghs_to_cny: Number(latest.rate_ghs_to_cny),
            };
        }
        return null;
    }

    /** Fetch USD/GHS and USD/CNY from FXR-API, derive GHS rates, store. Returns null on failure. */
    private async fetchAndStoreRatesFromFxr(): Promise<{ ghs_to_usd: number; ghs_to_cny: number } | null> {
        try {
            const [usdGhsRes, usdCnyRes] = await Promise.all([
                fetch(`${FXR_API_BASE}/usd/ghs`),
                fetch(`${FXR_API_BASE}/usd/cny`),
            ]);
            if (!usdGhsRes.ok || !usdCnyRes.ok) return null;
            const usdGhs = (await usdGhsRes.json()) as { pair: string; rate: number };
            const usdCny = (await usdCnyRes.json()) as { pair: string; rate: number };
            const usdPerGhs = usdGhs.rate > 0 ? 1 / usdGhs.rate : 0;
            const cnyPerGhs = usdGhs.rate > 0 ? usdCny.rate / usdGhs.rate : 0;
            if (usdPerGhs <= 0 || cnyPerGhs <= 0) return null;
            await this.prisma.shopCurrencyRate.create({
                data: {
                    rate_ghs_to_usd: usdPerGhs,
                    rate_ghs_to_cny: cnyPerGhs,
                },
            });
            return { ghs_to_usd: usdPerGhs, ghs_to_cny: cnyPerGhs };
        } catch {
            return null;
        }
    }

    // --- Admin: Hero slides ---

    async getHeroSlidesAdmin() {
        return this.prisma.heroSlide.findMany({ orderBy: { sort_order: 'asc' } });
    }

    async createHeroSlide(dto: CreateHeroSlideDto) {
        return this.prisma.heroSlide.create({
            data: {
                ...dto,
                sort_order: dto.sort_order ?? 0,
                is_active: dto.is_active ?? true,
                updated_at: new Date(),
            },
        });
    }

    async updateHeroSlide(id: number, dto: UpdateHeroSlideDto) {
        await this.prisma.heroSlide.findFirstOrThrow({ where: { id } });
        return this.prisma.heroSlide.update({
            where: { id },
            data: { ...dto, updated_at: new Date() },
        });
    }

    async deleteHeroSlide(id: number) {
        return this.prisma.heroSlide.delete({ where: { id } });
    }

    // --- Admin: Trust badges ---

    async getTrustBadgesAdmin() {
        return this.prisma.trustBadge.findMany({ orderBy: { sort_order: 'asc' } });
    }

    async createTrustBadge(dto: CreateTrustBadgeDto) {
        return this.prisma.trustBadge.create({
            data: {
                ...dto,
                sort_order: dto.sort_order ?? 0,
                is_active: dto.is_active ?? true,
                updated_at: new Date(),
            },
        });
    }

    async updateTrustBadge(id: number, dto: UpdateTrustBadgeDto) {
        await this.prisma.trustBadge.findFirstOrThrow({ where: { id } });
        return this.prisma.trustBadge.update({
            where: { id },
            data: { ...dto, updated_at: new Date() },
        });
    }

    async deleteTrustBadge(id: number) {
        return this.prisma.trustBadge.delete({ where: { id } });
    }

    // --- Admin: Testimonials ---

    async getTestimonialsAdmin() {
        return this.prisma.testimonial.findMany({ orderBy: { sort_order: 'asc' } });
    }

    async createTestimonial(dto: CreateTestimonialDto) {
        return this.prisma.testimonial.create({
            data: {
                ...dto,
                sort_order: dto.sort_order ?? 0,
                is_active: dto.is_active ?? true,
                updated_at: new Date(),
            },
        });
    }

    async updateTestimonial(id: number, dto: UpdateTestimonialDto) {
        await this.prisma.testimonial.findFirstOrThrow({ where: { id } });
        return this.prisma.testimonial.update({
            where: { id },
            data: { ...dto, updated_at: new Date() },
        });
    }

    async deleteTestimonial(id: number) {
        return this.prisma.testimonial.delete({ where: { id } });
    }

    // --- Admin: Policies ---

    async getPoliciesAdmin() {
        return this.prisma.sitePolicy.findMany({ orderBy: { type: 'asc' } });
    }

    async updatePolicy(type: string, dto: UpdatePolicyDto) {
        const existing = await this.prisma.sitePolicy.findUnique({ where: { type } });
        if (!existing) throw new NotFoundException('Policy not found');
        return this.prisma.sitePolicy.update({
            where: { type },
            data: { ...dto, updated_at: new Date() },
        });
    }

    // --- Admin: Homepage sections ---

    async getHomepageSectionsAdmin() {
        return this.prisma.homepageSection.findMany({ orderBy: { sort_order: 'asc' } });
    }

    async updateHomepageSection(sectionKey: string, dto: UpdateHomepageSectionDto) {
        await this.prisma.homepageSection.findFirstOrThrow({ where: { section_key: sectionKey } });
        return this.prisma.homepageSection.update({
            where: { section_key: sectionKey },
            data: { ...dto, updated_at: new Date() },
        });
    }

    async reorderHomepageSections(dto: ReorderSectionsDto) {
        const updates = dto.section_keys.map((key, i) =>
            this.prisma.homepageSection.update({
                where: { section_key: key },
                data: { sort_order: i, updated_at: new Date() },
            }),
        );
        await this.prisma.$transaction(updates);
        return this.getHomepageSectionsAdmin();
    }

    // --- Admin: Storefront settings ---

    async getStorefrontSettingsAdmin() {
        const keys = [
            'free_shipping_threshold_ghs',
            'standard_shipping_fee_ghs',
            'site_orders_delivered_text',
            'support_phone',
            'support_email',
        ];
        const rows = await this.prisma.setting.findMany({
            where: { setting_key: { in: keys } },
        });
        const map: Record<string, string> = {};
        keys.forEach(k => { map[k] = ''; });
        rows.forEach(r => { map[r.setting_key] = r.setting_value ?? ''; });
        return map;
    }

    async updateStorefrontSettings(dto: UpdateStorefrontSettingsDto) {
        const updates: Promise<unknown>[] = [];
        if (dto.free_shipping_threshold_ghs !== undefined) {
            updates.push(
                this.prisma.setting.upsert({
                    where: { setting_key: 'free_shipping_threshold_ghs' },
                    update: { setting_value: dto.free_shipping_threshold_ghs, updated_at: new Date() },
                    create: { setting_key: 'free_shipping_threshold_ghs', setting_value: dto.free_shipping_threshold_ghs, updated_at: new Date() },
                }),
            );
        }
        if (dto.standard_shipping_fee_ghs !== undefined) {
            updates.push(
                this.prisma.setting.upsert({
                    where: { setting_key: 'standard_shipping_fee_ghs' },
                    update: { setting_value: dto.standard_shipping_fee_ghs, updated_at: new Date() },
                    create: { setting_key: 'standard_shipping_fee_ghs', setting_value: dto.standard_shipping_fee_ghs, updated_at: new Date() },
                }),
            );
        }
        if (dto.site_orders_delivered_text !== undefined) {
            updates.push(
                this.prisma.setting.upsert({
                    where: { setting_key: 'site_orders_delivered_text' },
                    update: { setting_value: dto.site_orders_delivered_text, updated_at: new Date() },
                    create: { setting_key: 'site_orders_delivered_text', setting_value: dto.site_orders_delivered_text, updated_at: new Date() },
                }),
            );
        }
        if (dto.support_phone !== undefined) {
            updates.push(
                this.prisma.setting.upsert({
                    where: { setting_key: 'support_phone' },
                    update: { setting_value: dto.support_phone, updated_at: new Date() },
                    create: { setting_key: 'support_phone', setting_value: dto.support_phone, updated_at: new Date() },
                }),
            );
        }
        if (dto.support_email !== undefined) {
            updates.push(
                this.prisma.setting.upsert({
                    where: { setting_key: 'support_email' },
                    update: { setting_value: dto.support_email, updated_at: new Date() },
                    create: { setting_key: 'support_email', setting_value: dto.support_email, updated_at: new Date() },
                }),
            );
        }
        await Promise.all(updates);
        return this.getStorefrontSettingsAdmin();
    }

    ensureAdmin(user: { role?: string }) {
        if (user?.role !== 'admin' && user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
    }
}
