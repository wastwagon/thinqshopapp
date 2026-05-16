import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
@SkipThrottle()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Public()
    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Public()
    @Get('health')
    getHealth() {
        return this.appService.getHealth();
    }

    /** Readiness: DB connectivity + required env. Use for deploy smoke / orchestration. */
    @Public()
    @Get('ready')
    async getReady() {
        const ready = await this.appService.getReady();
        if (ready.status !== 'ready') {
            throw new ServiceUnavailableException(ready);
        }
        return ready;
    }
}
