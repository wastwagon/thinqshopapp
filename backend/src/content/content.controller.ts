import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ParseIntPipe,
    Header,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import {
    CreateHeroSlideDto,
    UpdateHeroSlideDto,
} from './dto/hero-slide.dto';
import {
    CreateTrustBadgeDto,
    UpdateTrustBadgeDto,
} from './dto/trust-badge.dto';
import {
    CreateTestimonialDto,
    UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { UpdatePolicyDto } from './dto/policy.dto';
import { UpdateHomepageSectionDto, ReorderSectionsDto } from './dto/homepage-section.dto';
import { UpdateStorefrontSettingsDto } from './dto/settings.dto';
import { NewsletterSignupDto } from './dto/newsletter-signup.dto';

@Controller('content')
export class ContentController {
    constructor(private readonly content: ContentService) {}

    // --- Public (storefront) ---

    @Get('hero-slides')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getHeroSlides() {
        return this.content.getHeroSlides();
    }

    @Get('trust-badges')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getTrustBadges() {
        return this.content.getTrustBadges();
    }

    @Get('testimonials')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getTestimonials() {
        return this.content.getTestimonials();
    }

    @Get('policies')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getPolicies() {
        return this.content.getPolicies();
    }

    @Get('homepage-sections')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getHomepageSections() {
        return this.content.getHomepageSections();
    }

    @Get('settings/public')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getPublicSettings() {
        return this.content.getPublicSettings();
    }

    @Post('newsletter/signup')
    @Public()
    @HttpCode(HttpStatus.OK)
    subscribeNewsletter(@Body() dto: NewsletterSignupDto) {
        return this.content.subscribeNewsletter(dto.email);
    }

    @Get('currency-rates')
    @Public()
    @Header('Cache-Control', 'public, max-age=3600')
    async getCurrencyRates() {
        const rates = await this.content.getCurrencyRates();
        return rates ?? { ghs_to_usd: null, ghs_to_cny: null };
    }

    // --- Admin: Hero slides ---

    @Get('admin/hero-slides')
    @UseGuards(AuthGuard)
    getHeroSlidesAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getHeroSlidesAdmin();
    }

    @Post('admin/hero-slides')
    @UseGuards(AuthGuard)
    createHeroSlide(@Request() req: any, @Body() dto: CreateHeroSlideDto) {
        this.content.ensureAdmin(req.user);
        return this.content.createHeroSlide(dto);
    }

    @Patch('admin/hero-slides/:id')
    @UseGuards(AuthGuard)
    updateHeroSlide(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHeroSlideDto,
    ) {
        this.content.ensureAdmin(req.user);
        return this.content.updateHeroSlide(id, dto);
    }

    @Delete('admin/hero-slides/:id')
    @UseGuards(AuthGuard)
    deleteHeroSlide(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        this.content.ensureAdmin(req.user);
        return this.content.deleteHeroSlide(id);
    }

    // --- Admin: Trust badges ---

    @Get('admin/trust-badges')
    @UseGuards(AuthGuard)
    getTrustBadgesAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getTrustBadgesAdmin();
    }

    @Post('admin/trust-badges')
    @UseGuards(AuthGuard)
    createTrustBadge(@Request() req: any, @Body() dto: CreateTrustBadgeDto) {
        this.content.ensureAdmin(req.user);
        return this.content.createTrustBadge(dto);
    }

    @Patch('admin/trust-badges/:id')
    @UseGuards(AuthGuard)
    updateTrustBadge(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTrustBadgeDto,
    ) {
        this.content.ensureAdmin(req.user);
        return this.content.updateTrustBadge(id, dto);
    }

    @Delete('admin/trust-badges/:id')
    @UseGuards(AuthGuard)
    deleteTrustBadge(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        this.content.ensureAdmin(req.user);
        return this.content.deleteTrustBadge(id);
    }

    // --- Admin: Testimonials ---

    @Get('admin/testimonials')
    @UseGuards(AuthGuard)
    getTestimonialsAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getTestimonialsAdmin();
    }

    @Post('admin/testimonials')
    @UseGuards(AuthGuard)
    createTestimonial(@Request() req: any, @Body() dto: CreateTestimonialDto) {
        this.content.ensureAdmin(req.user);
        return this.content.createTestimonial(dto);
    }

    @Patch('admin/testimonials/:id')
    @UseGuards(AuthGuard)
    updateTestimonial(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTestimonialDto,
    ) {
        this.content.ensureAdmin(req.user);
        return this.content.updateTestimonial(id, dto);
    }

    @Delete('admin/testimonials/:id')
    @UseGuards(AuthGuard)
    deleteTestimonial(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        this.content.ensureAdmin(req.user);
        return this.content.deleteTestimonial(id);
    }

    // --- Admin: Policies ---

    @Get('admin/policies')
    @UseGuards(AuthGuard)
    getPoliciesAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getPoliciesAdmin();
    }

    @Patch('admin/policies/:type')
    @UseGuards(AuthGuard)
    updatePolicy(
        @Request() req: any,
        @Param('type') type: string,
        @Body() dto: UpdatePolicyDto,
    ) {
        this.content.ensureAdmin(req.user);
        return this.content.updatePolicy(type, dto);
    }

    // --- Admin: Homepage sections ---

    @Get('admin/homepage-sections')
    @UseGuards(AuthGuard)
    getHomepageSectionsAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getHomepageSectionsAdmin();
    }

    @Patch('admin/homepage-sections/reorder')
    @UseGuards(AuthGuard)
    reorderHomepageSections(@Request() req: any, @Body() dto: ReorderSectionsDto) {
        this.content.ensureAdmin(req.user);
        return this.content.reorderHomepageSections(dto);
    }

    @Patch('admin/homepage-sections/:sectionKey')
    @UseGuards(AuthGuard)
    updateHomepageSection(
        @Request() req: any,
        @Param('sectionKey') sectionKey: string,
        @Body() dto: UpdateHomepageSectionDto,
    ) {
        this.content.ensureAdmin(req.user);
        return this.content.updateHomepageSection(sectionKey, dto);
    }

    // --- Admin: Storefront settings ---

    @Get('admin/settings/storefront')
    @UseGuards(AuthGuard)
    getStorefrontSettingsAdmin(@Request() req: any) {
        this.content.ensureAdmin(req.user);
        return this.content.getStorefrontSettingsAdmin();
    }

    @Patch('admin/settings/storefront')
    @UseGuards(AuthGuard)
    updateStorefrontSettings(@Request() req: any, @Body() dto: UpdateStorefrontSettingsDto) {
        this.content.ensureAdmin(req.user);
        return this.content.updateStorefrontSettings(dto);
    }
}
