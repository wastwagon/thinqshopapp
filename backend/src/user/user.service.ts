import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PROFILE_UPLOAD_SUBDIR = 'profile-images';
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    /** Admin: get single user with full details (no password). */
    async findOneForAdmin(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                wallet: { select: { balance_ghs: true } },
                _count: { select: { orders: true, addresses: true } },
            },
        });
        if (!user) throw new NotFoundException('User not found');
        const { password, ...rest } = user;
        return rest;
    }

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

    async updateProfile(userId: number, data: UpdateProfileDto) {
        const profileFields = ['first_name', 'last_name', 'profile_image', 'date_of_birth', 'gender'] as const;
        const profileData: Record<string, unknown> = {};
        profileFields.forEach((f) => {
            if (data[f] !== undefined) profileData[f] = data[f];
        });
        const userFields = ['phone'] as const;
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

    /** Save avatar image under uploads/profile-images and store public path on profile. */
    async saveProfileAvatar(userId: number, file: Express.Multer.File) {
        if (!file?.buffer?.length) throw new BadRequestException('No file uploaded');
        if (!AVATAR_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
        }
        if (file.size > AVATAR_MAX_BYTES) throw new BadRequestException('Image must be 5MB or smaller');

        const dir = path.join(process.cwd(), 'uploads', PROFILE_UPLOAD_SUBDIR);
        await fs.mkdir(dir, { recursive: true });
        const ext = path.extname(file.originalname || '') || (file.mimetype === 'image/png' ? '.png' : '.jpg');
        const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
        const filename = `user-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
        await fs.writeFile(path.join(dir, filename), file.buffer);

        const publicPath = `/media/${PROFILE_UPLOAD_SUBDIR}/${filename}`;
        await this.prisma.userProfile.upsert({
            where: { user_id: userId },
            create: { user_id: userId, profile_image: publicPath },
            update: { profile_image: publicPath },
        });
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
