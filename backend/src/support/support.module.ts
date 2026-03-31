import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, NotificationModule, AuthModule],
    controllers: [SupportController],
    providers: [SupportService],
})
export class SupportModule {}
