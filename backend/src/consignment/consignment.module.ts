import { Module, forwardRef } from '@nestjs/common';
import { ConsignmentService } from './consignment.service';
import { ConsignmentController } from './consignment.controller';
import { ConsignmentEscrowScheduler } from './consignment-escrow.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { FinanceModule } from '../finance/finance.module';
import { AuditModule } from '../audit/audit.module';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { NotificationModule } from '../notification/notification.module';
import { SmsModule } from '../sms/sms.module';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        MediaModule,
        forwardRef(() => FinanceModule),
        forwardRef(() => OrderModule),
        AuditModule,
        EmailTemplateModule,
        NotificationModule,
        SmsModule,
    ],
    providers: [ConsignmentService, ConsignmentEscrowScheduler],
    controllers: [ConsignmentController],
    exports: [ConsignmentService],
})
export class ConsignmentModule { }
