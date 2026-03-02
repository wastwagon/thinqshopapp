import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
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
        const { first_name, last_name, password, phone, email } = data;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate TQ-ID: TQ-[FIRST_NAME]-[4-DIGITS]
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const tqId = `TQ-${first_name || 'USER'}-${randomDigits}`;

        const user = await this.prisma.user.create({
            data: {
                email,
                phone: phone && String(phone).trim() ? String(phone).trim() : null,
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

    async forgotPassword(email: string): Promise<void> {
        // Stub: in production, find user, generate token, send email
        // Always succeed to prevent email enumeration
        if (email) {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (user) {
                // TODO: generate reset token, send email via mail service
            }
        }
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
