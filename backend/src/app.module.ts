import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
