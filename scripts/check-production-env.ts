/**
 * Validate environment before deploy. Exit 0 if OK, 1 if required vars missing.
 * Usage: DATABASE_URL=... JWT_SECRET=... npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/check-production-env.ts
 * Or: npm run deploy:check (loads .env if present via deploy-smoke.sh)
 */

type Level = 'error' | 'warn';

type Check = { key: string; level: Level; ok: boolean; hint?: string };

function has(v: string | undefined): boolean {
    return typeof v === 'string' && v.trim().length > 0;
}

function isProduction(): boolean {
    return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function runChecks(): Check[] {
    const prod = isProduction();
    return [
        {
            key: 'POSTGRES_PASSWORD',
            level: prod ? 'error' : 'warn',
            ok: has(process.env.POSTGRES_PASSWORD),
            hint: 'Required for docker-compose.yaml full stack; must match postgres_data volume after first deploy',
        },
        {
            key: 'DATABASE_URL',
            level: 'error',
            ok: has(process.env.DATABASE_URL),
            hint: 'PostgreSQL connection string',
        },
        {
            key: 'JWT_SECRET',
            level: 'error',
            ok: has(process.env.JWT_SECRET) && process.env.JWT_SECRET !== 'your_secret_key',
            hint: 'Use openssl rand -hex 32',
        },
        {
            key: 'FRONTEND_URL',
            level: prod ? 'error' : 'warn',
            ok: has(process.env.FRONTEND_URL) || has(process.env.CORS_ORIGIN),
            hint: 'Comma-separated storefront URL(s) for CORS and password-reset links',
        },
        {
            key: 'NEXT_PUBLIC_API_URL',
            level: prod ? 'warn' : 'warn',
            ok: has(process.env.NEXT_PUBLIC_API_URL) || has(process.env.BACKEND_URL),
            hint: 'Public API URL for Next.js proxy / SSR',
        },
        {
            key: 'PAYSTACK_SECRET_KEY',
            level: prod ? 'warn' : 'warn',
            ok: has(process.env.PAYSTACK_SECRET_KEY),
            hint: 'Required for card payments',
        },
        {
            key: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
            level: prod ? 'warn' : 'warn',
            ok: has(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
            hint: 'Paystack public key for checkout popup',
        },
        {
            key: 'SMTP_HOST',
            level: 'warn',
            ok: has(process.env.SMTP_HOST),
            hint: 'Needed to send queued emails (npm run email:process)',
        },
        {
            key: 'SMTP_FROM',
            level: 'warn',
            ok: has(process.env.SMTP_FROM) || has(process.env.SMTP_USER),
            hint: 'From address for transactional email',
        },
    ];
}

function main(): void {
    const checks = runChecks();
    const errors = checks.filter((c) => c.level === 'error' && !c.ok);
    const warnings = checks.filter((c) => c.level === 'warn' && !c.ok);

    console.log(`ThinQShop deploy env check (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    console.log('');

    for (const c of checks) {
        const icon = c.ok ? '✓' : c.level === 'error' ? '✗' : '!';
        const line = `  ${icon} ${c.key}`;
        console.log(c.ok ? line : `${line} — ${c.hint || 'missing'}`);
    }

    if (warnings.length > 0) {
        console.log('');
        console.log(`${warnings.length} warning(s) — review before production.`);
    }

    if (errors.length > 0) {
        console.log('');
        console.error(`${errors.length} required variable(s) missing. Fix and re-run.`);
        process.exit(1);
    }

    console.log('');
    console.log('Required environment OK.');
}

main();
