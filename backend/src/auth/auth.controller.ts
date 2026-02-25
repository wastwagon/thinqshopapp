import { Controller, Post, Body, Delete, UnauthorizedException, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() body: { email?: string }) {
        // Always return success to prevent email enumeration
        await this.authService.forgotPassword(body.email || '');
        return { message: 'If an account exists, reset instructions have been sent.' };
    }

    @UseGuards(AuthGuard)
    @Post('change-password')
    async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.sub, dto);
    }

    @UseGuards(AuthGuard)
    @Delete('account')
    @HttpCode(HttpStatus.OK)
    async deleteAccount(@Request() req) {
        return this.authService.deleteAccount(req.user.sub);
    }
}
