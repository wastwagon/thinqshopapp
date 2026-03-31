import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import { ConfirmOrderPaymentDto, ResolveReturnDto, ReturnRequestDto, UpdateOrderStatusDto } from './dto/order-admin.dto';

@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly auditService: AuditService,
    ) { }

    @Get('admin/list')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.ORDERS_READ_ALL)
    async findAllAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; status?: string }) {
        return this.orderService.findAllForAdmin(query);
    }

    @Get('admin/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.ORDERS_READ_ALL)
    async findOneAdmin(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.orderService.findOneForAdmin(id);
    }

    @Patch('admin/:id/status')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.ORDERS_MANAGE)
    async updateStatusAdmin(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateOrderStatusDto) {
        const updated = await this.orderService.updateOrderStatus(id, body.status);
        await this.auditService.logAdminAction(req, 'order.status.update', {
            tableName: 'orders',
            recordId: id,
            details: { status: body.status },
        });
        return updated;
    }

    @Patch('admin/:id/return')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.ORDERS_MANAGE)
    async resolveReturnRequest(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ResolveReturnDto) {
        const updated = await this.orderService.resolveReturnRequest(id, body.action as any, body.notes);
        await this.auditService.logAdminAction(req, 'order.return.resolve', {
            tableName: 'orders',
            recordId: id,
            details: { action: body.action },
        });
        return updated;
    }

    @UseGuards(AuthGuard)
    @Get('quote/checkout')
    getCheckoutQuote(@Request() req: any, @Query('shipping_address_id', ParseIntPipe) shippingAddressId: number) {
        return this.orderService.quoteCheckout(req.user.sub, shippingAddressId);
    }

    @UseGuards(AuthGuard)
    @Post()
    create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(req.user.sub, createOrderDto);
    }

    @UseGuards(AuthGuard)
    @Post(':id/confirm-payment')
    async confirmPayment(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: ConfirmOrderPaymentDto,
    ) {
        const ref = body?.paystack_reference?.trim();
        if (!ref) throw new BadRequestException('paystack_reference is required');
        return this.orderService.confirmOrderPayment(id, req.user.sub, ref);
    }

    @UseGuards(AuthGuard)
    @Get()
    findAll(@Request() req) {
        return this.orderService.findAll(req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.orderService.findOne(id, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch(':id/cancel')
    cancelOwnOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.orderService.cancelOwnOrder(id, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Post(':id/return-request')
    requestReturn(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: ReturnRequestDto) {
        return this.orderService.requestReturn(req.user.sub, id, body.reason);
    }
}
