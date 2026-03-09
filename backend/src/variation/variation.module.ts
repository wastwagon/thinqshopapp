import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VariationController } from './variation.controller';
import { VariationService } from './variation.service';

@Module({
    imports: [AuthModule],
    controllers: [VariationController],
    providers: [VariationService],
    exports: [VariationService],
})
export class VariationModule {}
