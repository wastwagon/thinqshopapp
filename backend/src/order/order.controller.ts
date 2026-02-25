import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ParseIntPipe, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Get('admin/list')
    @UseGuards(AuthGuard)
    async findAllAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; status?: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.orderService.findAllForAdmin(query);
    }

    @Patch('admin/:id/status')
    @UseGuards(AuthGuard)
    async updateStatusAdmin(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.orderService.updateOrderStatus(id, body.status);
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
        @Body() body: { paystack_reference?: string },
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
}
