import { Module } from '@nestjs/common';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';
import { OrderModule } from '../order/order.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { FinanceModule } from '../finance/finance.module';
import { ProcurementModule } from '../procurement/procurement.module';

@Module({
    imports: [OrderModule, LogisticsModule, FinanceModule, ProcurementModule],
    controllers: [TrackController],
    providers: [TrackService],
})
export class TrackModule {}
