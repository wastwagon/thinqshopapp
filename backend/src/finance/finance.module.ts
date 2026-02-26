import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';

@Module({
    imports: [PrismaModule, AuthModule],
    providers: [PaymentService, WalletService, TransferService],
    controllers: [PaymentController, WalletController, TransferController],
    exports: [WalletService, PaymentService, TransferService],
})
export class FinanceModule { }
