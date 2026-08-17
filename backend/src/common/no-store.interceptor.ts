import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class NoStoreInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            tap(() => {
                context.switchToHttp().getResponse().setHeader('Cache-Control', 'private, no-store');
            }),
        );
    }
}
