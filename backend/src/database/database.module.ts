import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuthModule, AuditModule],
    controllers: [DatabaseController],
})
export class DatabaseModule { }
