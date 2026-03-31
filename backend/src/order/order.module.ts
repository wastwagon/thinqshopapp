import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { AddressModule } from '../address/address.module';
import { FinanceModule } from '../finance/finance.module';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { SmsModule } from '../sms/sms.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuthModule, CartModule, AddressModule, FinanceModule, EmailTemplateModule, SmsModule, NotificationModule, AuditModule],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule { }
