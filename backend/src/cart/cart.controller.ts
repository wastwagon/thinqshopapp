import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Request() req) {
        return this.cartService.getCart(req.user.sub);
    }

    @Post()
    addToCart(@Request() req, @Body() dto: AddToCartDto) {
        return this.cartService.addToCart(req.user.sub, dto);
    }

    @Patch(':id')
    updateItem(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartItemDto) {
        return this.cartService.updateItem(req.user.sub, id, dto);
    }

    @Delete(':id')
    removeFromCart(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.cartService.removeFromCart(req.user.sub, id);
    }

    @Delete()
    clearCart(@Request() req) {
        return this.cartService.clearCart(req.user.sub);
    }
}
