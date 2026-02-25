import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DatabaseController],
})
export class DatabaseModule { }
