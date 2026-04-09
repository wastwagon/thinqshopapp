import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { PermissionGuard } from './permission.guard';

/**
 * Runs JWT validation before permission checks. Required as a single global guard because
 * Nest runs all global guards before controller/route guards; the previous setup registered
 * PermissionGuard globally alone, so @RequirePermission ran with no req.user and returned 403
 * for unauthenticated requests (and broke the frontend 401 → login flow).
 */
@Injectable()
export class AuthBeforePermissionGlobalGuard implements CanActivate {
    constructor(
        private readonly authGuard: AuthGuard,
        private readonly permissionGuard: PermissionGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        await this.authGuard.canActivate(context);
        return this.permissionGuard.canActivate(context);
    }
}
