import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Parse JWT_SECRET= from a dotenv-style file body. Strips surrounding quotes. */
export function parseJwtSecretFromEnvText(contents: string): string {
    const line = contents.split(/\r?\n/).find((row) => row.startsWith('JWT_SECRET='));
    if (!line) return '';
    return line.slice('JWT_SECRET='.length).replace(/^["']|["']$/g, '').trim();
}

function candidateEnvFiles(): string[] {
    const files: string[] = [];
    const seen = new Set<string>();
    const add = (file: string) => {
        const resolved = resolve(file);
        if (seen.has(resolved)) return;
        seen.add(resolved);
        files.push(resolved);
    };

    const roots = new Set<string>([process.cwd(), join(process.cwd(), '..')]);
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        roots.add(here);
        roots.add(join(here, '..'));
        roots.add(join(here, '../..'));
    } catch {
        // Next may compile this without import.meta.url
    }

    for (const root of Array.from(roots)) {
        add(join(root, '.env'));
        add(join(root, '.env.local'));
        add(join(root, '../.env'));
    }
    return files;
}

/**
 * Ensure process.env.JWT_SECRET is set from web/.env or the repo-root .env.
 * Node-only — do not import from Edge middleware.
 */
export function ensureJwtSecretLoaded(): string {
    const existing = (process.env.JWT_SECRET || '').trim();
    if (existing) {
        process.env.JWT_SECRET = existing;
        return existing;
    }

    for (const file of candidateEnvFiles()) {
        if (!existsSync(file)) continue;
        const secret = parseJwtSecretFromEnvText(readFileSync(file, 'utf8'));
        if (secret) {
            process.env.JWT_SECRET = secret;
            return secret;
        }
    }
    return '';
}
