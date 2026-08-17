import { randomBytes } from 'crypto';

/** Unenumerable public id: PREFIX- + hex. Fits Prisma VarChar(50). */
export function randomPublicId(prefix: string, bytes = 12): string {
    const clean = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `${clean}-${randomBytes(bytes).toString('hex')}`;
}
