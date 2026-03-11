import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceRateService } from './invoice-rate.service';
import { InvoiceRateController } from './invoice-rate.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';

@Module({
    imports: [PrismaModule, AuthModule, SmsModule],
    controllers: [InvoiceController, InvoiceRateController],
    providers: [InvoiceService, InvoiceRateService],
    exports: [InvoiceService, InvoiceRateService],
})
export class InvoiceModule {}
