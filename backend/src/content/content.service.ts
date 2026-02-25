import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
