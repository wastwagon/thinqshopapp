import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * Mark a route as public (no JWT required).
 * Use on controllers or individual route handlers to bypass AuthGuard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * JWT is used when present; missing or invalid tokens continue as a guest.
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
