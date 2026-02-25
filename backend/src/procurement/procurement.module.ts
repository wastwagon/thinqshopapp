import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [PrismaModule, AuthModule, FinanceModule],
    providers: [ProcurementService],
    controllers: [ProcurementController],
})
export class ProcurementModule { }
