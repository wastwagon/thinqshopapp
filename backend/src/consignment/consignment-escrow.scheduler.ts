import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsignmentService } from './consignment.service';

/** Daily job: auto-deliver shipped consignment orders when enabled in Sell for Me settings. */
@Injectable()
export class ConsignmentEscrowScheduler {
    private readonly logger = new Logger(ConsignmentEscrowScheduler.name);

    constructor(private consignmentService: ConsignmentService) { }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async runDailyAutoRelease() {
        try {
            const result = await this.consignmentService.processAutoEscrowReleases({ source: 'cron' });
            if (result.processed > 0) {
                this.logger.log(`Auto-released ${result.processed} escrow payout(s)`);
            }
        } catch (err) {
            this.logger.error('Consignment escrow auto-release cron failed', err instanceof Error ? err.stack : err);
        }
    }
}
