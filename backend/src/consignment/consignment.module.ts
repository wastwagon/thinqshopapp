import { Module } from '@nestjs/common';
import { ConsignmentService } from './consignment.service';
import { ConsignmentController } from './consignment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { FinanceModule } from '../finance/finance.module';
import { AuditModule } from '../audit/audit.module';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { NotificationModule } from '../notification/notification.module';
import { SmsModule } from '../sms/sms.module';

@Module({
    imports: [PrismaModule, AuthModule, MediaModule, FinanceModule, AuditModule, EmailTemplateModule, NotificationModule, SmsModule],
    providers: [ConsignmentService],
    controllers: [ConsignmentController],
    exports: [ConsignmentService],
})
export class ConsignmentModule { }
