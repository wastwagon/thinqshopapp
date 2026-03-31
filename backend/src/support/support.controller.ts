import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Controller('support')
@UseGuards(AuthGuard)
export class SupportController {
    constructor(private readonly supportService: SupportService) {}

    @Post('tickets')
    createTicket(@Request() req: any, @Body() body: CreateSupportTicketDto) {
        return this.supportService.createTicket(req.user.sub, body);
    }
}
