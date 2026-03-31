import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VariationController } from './variation.controller';
import { VariationService } from './variation.service';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AuthModule, AuditModule],
    controllers: [VariationController],
    providers: [VariationService],
    exports: [VariationService],
})
export class VariationModule {}
