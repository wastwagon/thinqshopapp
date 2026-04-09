import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { CartModule } from './cart/cart.module';
import { FinanceModule } from './finance/finance.module';
import { AddressModule } from './address/address.module';
import { LogisticsModule } from './logistics/logistics.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './notification/notification.module';
import { MediaModule } from './media/media.module';
import { EmailTemplateModule } from './email-template/email-template.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { TrackModule } from './track/track.module';
import { VariationModule } from './variation/variation.module';
import { SmsModule } from './sms/sms.module';
import { InvoiceModule } from './invoice/invoice.module';
import { AuditModule } from './audit/audit.module';
import { AuthGuard } from './auth/auth.guard';
import { PermissionGuard } from './auth/permission.guard';
import { AuthBeforePermissionGlobalGuard } from './auth/auth-before-permission-global.guard';
import { SupportModule } from './support/support.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        // Admin dashboards fire many parallel API calls; generous per-minute cap avoids 429 storms.
        ThrottlerModule.forRoot([
            { ttl: 60000, limit: 400 },
        ]),
        PrismaModule,
        UserModule,
        AuthModule,
        ProductModule,
        MediaModule,
        CartModule,
        OrderModule,
        AddressModule,
        FinanceModule,
        LogisticsModule,
        ProcurementModule,
        NotificationModule,
        EmailTemplateModule,
        ContentModule,
        DatabaseModule,
        TrackModule,
        VariationModule,
        SmsModule,
        InvoiceModule,
        AuditModule,
        SupportModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        AuthGuard,
        PermissionGuard,
        AuthBeforePermissionGlobalGuard,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AuthBeforePermissionGlobalGuard },
    ],
})
export class AppModule { }
