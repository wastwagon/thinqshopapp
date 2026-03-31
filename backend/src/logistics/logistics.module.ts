import { Module } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { SmsModule } from '../sms/sms.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuthModule, FinanceModule, SmsModule, AuditModule],
    providers: [LogisticsService],
    controllers: [LogisticsController],
    exports: [LogisticsService],
})
export class LogisticsModule { }
