import { Module } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuthModule, AuditModule],
    controllers: [EmailTemplateController],
    providers: [EmailTemplateService],
    exports: [EmailTemplateService],
})
export class EmailTemplateModule { }
