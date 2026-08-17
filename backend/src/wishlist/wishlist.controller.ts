import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { NoStoreInterceptor } from '../common/no-store.interceptor';
import { AuthGuard } from '../auth/auth.guard';
import { AddToWishlistDto, MergeWishlistDto } from './dto/wishlist.dto';
import { WishlistService } from './wishlist.service';

@UseGuards(AuthGuard)
@UseInterceptors(NoStoreInterceptor)
@Controller('wishlist')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) {}

    @Get()
    getWishlist(@Request() req) {
        return this.wishlistService.getWishlist(req.user.sub);
    }

    @Post()
    add(@Request() req, @Body() dto: AddToWishlistDto) {
        return this.wishlistService.add(req.user.sub, dto);
    }

    @Post('merge')
    merge(@Request() req, @Body() dto: MergeWishlistDto) {
        return this.wishlistService.merge(req.user.sub, dto.productIds || []);
    }

    @Delete(':productId')
    remove(@Request() req, @Param('productId', ParseIntPipe) productId: number) {
        return this.wishlistService.remove(req.user.sub, productId);
    }
}
