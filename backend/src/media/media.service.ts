import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const FILES_SUBDIR = 'files';
const PUBLIC_PATH_PREFIX = `media/${FILES_SUBDIR}`;

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) {}

    getUploadDir(): string {
        return path.join(UPLOAD_DIR, FILES_SUBDIR);
    }

    async ensureUploadDir(): Promise<void> {
        const dir = this.getUploadDir();
        await fs.mkdir(dir, { recursive: true });
    }

    /** Generate unique filename: timestamp-random-originalname */
    uniqueFilename(originalName: string): string {
        const ext = path.extname(originalName) || '';
        const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80) || 'file';
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        return `${base}-${unique}${ext}`.toLowerCase();
    }

    /** Save uploaded file and create Media record. Returns URL path (e.g. /media/files/xxx.jpg) for use in product images. */
    async createFromFile(file: Express.Multer.File): Promise<{ id: number; path: string; url: string; filename: string; mime_type: string; size_bytes: number }> {
        await this.ensureUploadDir();
        const filename = this.uniqueFilename(file.originalname || 'upload');
        const dir = this.getUploadDir();
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, file.buffer);

        const relativePath = `${PUBLIC_PATH_PREFIX}/${filename}`;
        const record = await this.prisma.media.create({
            data: {
                filename,
                path: relativePath,
                mime_type: file.mimetype || null,
                size_bytes: file.size,
            },
        });
        return {
            id: record.id,
            path: '/' + relativePath,
            url: '/' + relativePath,
            filename: record.filename,
            mime_type: record.mime_type || '',
            size_bytes: record.size_bytes || 0,
        };
    }

    async findAll(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 48, search } = query;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.filename = { contains: search, mode: 'insensitive' };
        }
        const [items, total] = await Promise.all([
            this.prisma.media.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: Number(skip),
                take: Number(limit),
            }),
            this.prisma.media.count({ where }),
        ]);
        return {
            data: items.map((m) => ({
                id: m.id,
                filename: m.filename,
                path: '/' + m.path,
                url: '/' + m.path,
                mime_type: m.mime_type,
                size_bytes: m.size_bytes,
                alt: m.alt,
                created_at: m.created_at,
            })),
            meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        };
    }

    async findOne(id: number) {
        const m = await this.prisma.media.findUnique({ where: { id } });
        if (!m) throw new NotFoundException('Media not found');
        return { ...m, url: '/' + m.path };
    }

    async remove(id: number): Promise<void> {
        const m = await this.prisma.media.findUnique({ where: { id } });
        if (!m) throw new NotFoundException('Media not found');
        const fullPath = path.join(process.cwd(), m.path);
        try {
            await fs.unlink(fullPath);
        } catch {
            // ignore if file already missing
        }
        await this.prisma.media.delete({ where: { id } });
    }

    /** Resolve stored path to absolute file path for serving */
    resolveFilePath(relativePath: string): string {
        // relativePath like "media/files/xxx.jpg"
        if (relativePath.startsWith('media/') || relativePath.startsWith('/media/')) {
            const clean = relativePath.replace(/^\/+/, '');
            return path.join(process.cwd(), clean);
        }
        return path.join(this.getUploadDir(), path.basename(relativePath));
    }
}
