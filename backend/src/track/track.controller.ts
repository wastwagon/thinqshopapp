import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TrackService } from './track.service';
import { Public } from '../auth/public.decorator';

@Controller('track')
export class TrackController {
    constructor(private readonly trackService: TrackService) {}

    @Public()
    @Get(':reference')
    async track(@Param('reference') reference: string) {
        try {
            return await this.trackService.track(reference);
        } catch (err: any) {
            if (err?.status === 404 || err?.constructor?.name === 'NotFoundException') {
                throw new NotFoundException('Tracking ID not found. Please verify and try again.');
            }
            throw err;
        }
    }
}
