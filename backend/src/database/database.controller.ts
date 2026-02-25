import { Controller, Post, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { execSync } from 'child_process';
import { join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { runSeed } from '../../../database/seed-runner';

@Controller('admin/database')
@UseGuards(AuthGuard)
export class DatabaseController {
    private readonly projectRoot: string;

    constructor(private readonly prisma: PrismaService) {
        this.projectRoot = join(__dirname, '..', '..', '..');
    }

    private ensureAdmin(req: any) {
        const role = req.user?.role;
        if (role !== 'admin' && role !== 'superadmin') {
            throw new HttpException('Forbidden: admin or superadmin role required', HttpStatus.FORBIDDEN);
        }
    }

    @Post('migrate')
    async migrate(@Req() req: any) {
        this.ensureAdmin(req);
        try {
            const schemaPath = join(this.projectRoot, 'database', 'schema.prisma');
            execSync(`npx prisma generate --schema=${schemaPath}`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            });
            execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            });
            return { success: true, message: 'Migrations applied successfully' };
        } catch (err: any) {
            const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
            throw new HttpException(`Migration failed: ${output}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('seed')
    async seed(@Req() req: any) {
        this.ensureAdmin(req);
        try {
            await runSeed(this.prisma);
            return { success: true, message: 'Database seeded successfully' };
        } catch (err: any) {
            throw new HttpException(`Seed failed: ${err?.message || err}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('migrate-seed')
    async migrateAndSeed(@Req() req: any) {
        this.ensureAdmin(req);
        try {
            const schemaPath = join(this.projectRoot, 'database', 'schema.prisma');
            execSync(`npx prisma generate --schema=${schemaPath}`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            });
            execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            });
            await runSeed(this.prisma);
            return { success: true, message: 'Migration and seeding complete' };
        } catch (err: any) {
            const output = err?.stdout?.toString() || err?.stderr?.toString() || err?.message || err;
            throw new HttpException(`Migration failed: ${output}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
