import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('procurement')
@UseGuards(AuthGuard)
export class ProcurementController {
    constructor(private procurementService: ProcurementService) { }

    @Post('request')
    async createRequest(@Request() req, @Body() body: any) {
        return this.procurementService.createRequest(req.user.sub, body);
    }

    @Get('user')
    async findUserRequests(@Request() req) {
        return this.procurementService.findUserRequests(req.user.sub);
    }

    @Get('user/request/:id')
    async findUserRequestById(@Request() req, @Param('id') id: string) {
        return this.procurementService.findUserRequestById(req.user.sub, Number(id));
    }

    @Get(':requestNumber')
    async findRequest(@Param('requestNumber') requestNumber: string) {
        return this.procurementService.findRequest(requestNumber);
    }

    @Post('accept-quote')
    async acceptQuote(@Request() req, @Body() body: { quoteId: number }) {
        return this.procurementService.createOrderFromQuote(req.user.sub, body.quoteId);
    }

    @Get('admin/requests')
    async getAllRequests(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.getAllRequests();
    }

    @Patch('admin/:id/status')
    async updateRequestStatus(@Request() req, @Param('id') id: string, @Body() body: { status: any }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.updateRequestStatus(Number(id), body.status);
    }

    @Post('admin/:id/quote')
    async createQuote(@Request() req, @Param('id') id: string, @Body() body: { amount: number, details: string }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.createQuote(Number(id), body);
    }
}
