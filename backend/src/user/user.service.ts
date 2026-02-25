import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true, wallet: true },
        });
        if (!user) return null;

        const { profile, ...userData } = user;
        return {
            ...userData,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            profile_image: profile?.profile_image ?? null,
        };
    }

    async updateProfile(userId: number, data: any) {
        const profileFields = ['first_name', 'last_name', 'profile_image', 'date_of_birth', 'gender'] as const;
        const profileData: Record<string, unknown> = {};
        profileFields.forEach((f) => {
            if (data[f] !== undefined) profileData[f] = data[f];
        });
        const userFields = ['phone', 'ghana_card', 'voter_id'] as const;
        const userData: Record<string, unknown> = {};
        userFields.forEach((f) => {
            if (data[f] !== undefined) userData[f] = data[f];
        });
        await Promise.all([
            this.prisma.userProfile.upsert({
                where: { user_id: userId },
                create: { user_id: userId, ...profileData },
                update: profileData,
            }),
            Object.keys(userData).length > 0
                ? this.prisma.user.update({ where: { id: userId }, data: userData })
                : Promise.resolve(),
        ]);
        return this.findOne(userId);
    }

    async findAllForAdmin(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 50, search } = query;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { profile: true },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { data: users.map((u) => ({ ...u, password: undefined })), meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
    }
}
