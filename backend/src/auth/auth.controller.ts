import { Controller, Post, Body, Delete, UnauthorizedException, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PermissionGuard } from './permission.guard';
import { Public } from './public.decorator';
import { RequirePermission } from './require-permission.decorator';
import { PERMISSION_MAP } from './permissions';

const AUTH_THROTTLE = { default: { limit: 10, ttl: 60000 } };
const AUTH_EMAIL_THROTTLE = { default: { limit: 5, ttl: 60000 } };

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Throttle(AUTH_THROTTLE)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        const user = await this.authService.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Public()
    @Throttle(AUTH_THROTTLE)
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('admin/register')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.USERS_MANAGE)
    async adminRegister(@Request() req: any, @Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Throttle(AUTH_EMAIL_THROTTLE)
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        // Always return success to prevent email enumeration
        await this.authService.forgotPassword(dto.email || '');
        return { message: 'If an account exists, reset instructions have been sent.' };
    }

    @Public()
    @Throttle(AUTH_EMAIL_THROTTLE)
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
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
