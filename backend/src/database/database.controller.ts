import { Controller, Post, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { runSeed } from '../../../database/seed-runner';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('admin/database')
@UseGuards(AuthGuard)
export class DatabaseController {
    private readonly projectRoot: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
        this.projectRoot = this.resolveProjectRoot();
    }

    private resolveProjectRoot(): string {
        const candidates = [
            process.cwd(),
            join(process.cwd(), '..'),
            join(__dirname, '..', '..', '..', '..'),
        ];
        for (const root of candidates) {
            const schemaPath = join(root, 'database', 'schema.prisma');
            if (existsSync(schemaPath)) return root;
        }
        return process.cwd();
    }

    private ensureAdmin(req: any) {
        const role = req.user?.role;
        if (role !== 'admin' && role !== 'superadmin') {
            throw new HttpException('Forbidden: admin or superadmin role required', HttpStatus.FORBIDDEN);
        }
        const runtimeDbAdminEnabled = process.env.ENABLE_RUNTIME_DB_ADMIN === 'true';
        if (!runtimeDbAdminEnabled) {
            throw new HttpException('Runtime database admin endpoints are disabled', HttpStatus.FORBIDDEN);
        }
    }

    @Post('migrate')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.DATABASE_MANAGE)
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
            await this.auditService.logAdminAction(req, 'database.migrate', { tableName: 'database' });
            return { success: true, message: 'Migrations applied successfully' };
        } catch (err: any) {
            const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
            throw new HttpException(`Migration failed: ${output}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('seed')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.DATABASE_MANAGE)
    async seed(@Req() req: any) {
        this.ensureAdmin(req);
        try {
            await runSeed(this.prisma);
            await this.auditService.logAdminAction(req, 'database.seed', { tableName: 'database' });
            return { success: true, message: 'Database seeded successfully' };
        } catch (err: any) {
            throw new HttpException(`Seed failed: ${err?.message || err}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('migrate-seed')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.DATABASE_MANAGE)
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
            await this.auditService.logAdminAction(req, 'database.migrate_seed', { tableName: 'database' });
            return { success: true, message: 'Migration and seeding complete' };
        } catch (err: any) {
            const output = err?.stdout?.toString() || err?.stderr?.toString() || err?.message || err;
            throw new HttpException(`Migration failed: ${output}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
