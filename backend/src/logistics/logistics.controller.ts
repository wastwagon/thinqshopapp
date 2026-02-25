import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('logistics')
export class LogisticsController {
    constructor(private logisticsService: LogisticsService) { }

    @Post('book')
    @UseGuards(AuthGuard)
    async bookShipment(@Request() req, @Body() body: any) {
        return this.logisticsService.bookShipment(req.user.sub, body);
    }

    @Get('history')
    @UseGuards(AuthGuard)
    async getHistory(@Request() req) {
        return this.logisticsService.getUserShipments(req.user.sub);
    }

    @Post('calculate-price')
    async calculatePrice(@Body() body: any) {
        // Return full breakdown
        return this.logisticsService.calculatePrice({
            zoneId: Number(body.zoneId),
            weight: Number(body.weight),
            serviceType: body.serviceType
        });
    }

    @Get('track/:trackingNumber')
    async trackShipment(@Param('trackingNumber') trackingNumber: string) {
        return this.logisticsService.trackShipment(trackingNumber);
    }

    @Get('zones')
    async getZones() {
        return this.logisticsService.getZones();
    }

    @Get('warehouses')
    async getWarehouses() {
        return this.logisticsService.getWarehouses();
    }

    @Get('freight-rates')
    async getFreightRates(@Query('method') method?: string) {
        const m = method === 'sea_freight' ? 'sea_freight' : method === 'air_freight' ? 'air_freight' : undefined;
        return this.logisticsService.getFreightRates(m);
    }

    @Get('admin/freight-rates')
    @UseGuards(AuthGuard)
    async getAllFreightRates(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.getAllFreightRates();
    }

    @Post('admin/freight-rates')
    @UseGuards(AuthGuard)
    async createFreightRate(@Request() req, @Body() body: any) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.createFreightRate(body);
    }

    @Patch('admin/freight-rates/:id')
    @UseGuards(AuthGuard)
    async updateFreightRate(@Request() req, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.updateFreightRate(Number(id), body);
    }

    @Delete('admin/freight-rates/:id')
    @UseGuards(AuthGuard)
    async deleteFreightRate(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.deleteFreightRate(Number(id));
    }

    @Get('admin/shipments')
    @UseGuards(AuthGuard)
    async getAllShipments(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.getAllShipments();
    }

    @Patch('admin/shipments/:id/status')
    @UseGuards(AuthGuard)
    async updateShipmentStatus(@Request() req, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        const { status, notes } = body;
        return this.logisticsService.updateShipmentStatus(Number(id), status, notes);
    }

    @Post('admin/simulate-webhook/:id')
    @UseGuards(AuthGuard)
    async simulateWebhook(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.logisticsService.simulateWebhookAdvance(Number(id));
    }
}
