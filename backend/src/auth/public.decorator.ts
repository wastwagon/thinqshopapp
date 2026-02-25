import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no JWT required).
 * Use on controllers or individual route handlers to bypass AuthGuard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
