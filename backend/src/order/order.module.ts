import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { AddressModule } from '../address/address.module';
import { FinanceModule } from '../finance/finance.module';
import { EmailTemplateModule } from '../email-template/email-template.module';

@Module({
    imports: [PrismaModule, AuthModule, CartModule, AddressModule, FinanceModule, EmailTemplateModule],
    controllers: [OrderController],
    providers: [OrderService],
})
export class OrderModule { }
