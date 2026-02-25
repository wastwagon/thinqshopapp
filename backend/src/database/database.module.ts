import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [DatabaseController],
})
export class DatabaseModule { }
