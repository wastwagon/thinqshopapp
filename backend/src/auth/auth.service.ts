import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(emailOrPhone: string, pass: string): Promise<any> {
        const input = (emailOrPhone || '').trim();
        const isEmail = input.includes('@');
        let user: any = null;
        if (isEmail) {
            user = await this.prisma.user.findUnique({ where: { email: input } });
        } else {
            const digits = input.replace(/\D/g, '');
            const variants = [input, digits, `+${digits}`].filter(Boolean);
            user = await this.prisma.user.findFirst({
                where: { phone: { in: variants } },
            });
        }
        if (!user) return null;
        if (!user.is_active) throw new UnauthorizedException('Account is deactivated');
        if (!(await bcrypt.compare(pass, user.password))) return null;
        const { password, ...result } = user;
        return result;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, role: user.role }
        };
    }

    async register(data: RegisterDto) {
        const { first_name, last_name, password, phone: optionalPhone, email: emailOrPhone } = data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const isEmail = (emailOrPhone || '').trim().includes('@');
        const normalized = (emailOrPhone || '').trim();
        let email: string;
        let phone: string | null = null;
        if (isEmail) {
            email = normalized;
            if (optionalPhone && String(optionalPhone).trim()) {
                phone = String(optionalPhone).trim();
            }
        } else {
            const digits = normalized.replace(/\D/g, '');
            phone = digits.length >= 10 ? `+${digits}` : normalized;
            email = `phone-${digits}@thinqshop.local`;
        }

        // Generate TQ-ID: TQ-[FIRST_NAME]-[4-DIGITS]
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const tqId = `TQ-${first_name || 'USER'}-${randomDigits}`;

        const user = await this.prisma.user.create({
            data: {
                email,
                phone,
                password: hashedPassword,
                user_identifier: tqId,
                profile: {
                    create: {
                        first_name,
                        last_name,
                    }
                },
                wallet: {
                    create: {
                        balance_ghs: 0
                    }
                }
            },
            include: {
                profile: true
            }
        });

        const { password: _, ...result } = user;
        return result;
    }

    private hashResetToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private getFrontendBaseUrl(): string {
        const raw = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        return raw.split(',')[0]?.trim() || 'http://localhost:3000';
    }

    async forgotPassword(email: string): Promise<void> {
        const normalized = (email || '').trim();
        if (!normalized || !normalized.includes('@')) return;

        const user = await this.prisma.user.findUnique({ where: { email: normalized } });
        if (!user) return;

        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await this.prisma.passwordResetToken.deleteMany({ where: { user_id: user.id } });
        await this.prisma.passwordResetToken.create({
            data: { user_id: user.id, token_hash: tokenHash, expires_at: expiresAt },
        });

        const resetUrl = `${this.getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
        await this.prisma.emailQueue.create({
            data: {
                recipient: user.email,
                subject: 'Reset your ThinQShop password',
                body: [
                    'Hi,',
                    '',
                    'We received a request to reset your password. Open this link within 1 hour:',
                    '',
                    resetUrl,
                    '',
                    'If you did not request this, you can ignore this email.',
                    '',
                    'ThinQShop',
                ].join('\n'),
                status: 'pending',
            },
        });
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const token = (dto.token || '').trim();
        if (!token) throw new BadRequestException('Invalid or expired reset link');

        const record = await this.prisma.passwordResetToken.findUnique({
            where: { token_hash: this.hashResetToken(token) },
        });
        if (!record || record.expires_at < new Date()) {
            throw new BadRequestException('Invalid or expired reset link');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.user_id },
                data: { password: hashedPassword },
            }),
            this.prisma.passwordResetToken.deleteMany({ where: { user_id: record.user_id } }),
        ]);

        return { message: 'Password updated successfully' };
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) throw new UnauthorizedException('Incorrect current password');

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async deleteAccount(userId: number): Promise<{ message: string }> {
        await this.prisma.$transaction(async (tx) => {
            // Delete in dependency order (relations without onDelete: Cascade from User)
            await tx.couponUsage.deleteMany({ where: { user_id: userId } });
            await tx.order.deleteMany({ where: { user_id: userId } });
            await tx.moneyTransfer.deleteMany({ where: { user_id: userId } });
            await tx.shipment.deleteMany({ where: { user_id: userId } });
            const requests = await tx.procurementRequest.findMany({ where: { user_id: userId }, select: { id: true } });
            const requestIds = requests.map((r) => r.id);
            if (requestIds.length > 0) {
                await tx.procurementQuote.deleteMany({ where: { request_id: { in: requestIds } } });
            }
            await tx.procurementOrder.deleteMany({ where: { user_id: userId } });
            await tx.procurementRequest.deleteMany({ where: { user_id: userId } });
            await tx.user.delete({ where: { id: userId } });
        });
        return { message: 'Account deleted successfully' };
    }
}
