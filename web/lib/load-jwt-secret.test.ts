import { describe, it, expect } from 'vitest';
import { parseJwtSecretFromEnvText } from './load-jwt-secret';

describe('parseJwtSecretFromEnvText', () => {
    it('reads an unquoted value', () => {
        expect(parseJwtSecretFromEnvText('FOO=1\nJWT_SECRET=abc123\n')).toBe('abc123');
    });

    it('strips surrounding quotes', () => {
        expect(parseJwtSecretFromEnvText('JWT_SECRET="quoted-secret"\n')).toBe('quoted-secret');
        expect(parseJwtSecretFromEnvText("JWT_SECRET='also-quoted'\n")).toBe('also-quoted');
    });

    it('returns empty when missing', () => {
        expect(parseJwtSecretFromEnvText('DATABASE_URL=postgres\n')).toBe('');
    });
});
