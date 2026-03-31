import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator';
import { ROLE_PERMISSIONS, PERMISSION_MAP } from './permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermission = this.reflector.getAllAndOverride<string>(REQUIRED_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermission) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const role = user?.role;
        const rolePermissions = ROLE_PERMISSIONS[role] || [];
        const inlinePermissions = Array.isArray(user?.permissions) ? user.permissions : [];
        const effectivePermissions = new Set<string>([...rolePermissions, ...inlinePermissions]);

        if (effectivePermissions.has(PERMISSION_MAP.SUPERADMIN) || effectivePermissions.has(requiredPermission)) {
            return true;
        }
        throw new ForbiddenException('Insufficient permission');
    }
}
