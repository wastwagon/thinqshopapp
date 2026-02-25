# Database

## Migrations

Run migrations to apply schema changes:

```bash
npx prisma migrate deploy
```

For local development:

```bash
npx prisma migrate dev
```

## Seeds

**Do not run seed scripts in production** except for the initial bootstrap below.

### Bootstrap (optional, first-time setup)

- **`seed.ts`** — Creates a default admin user, sample categories, shipping zones, and an exchange rate. Safe to run once per environment when you need initial data (e.g. staging or a fresh production DB). Do not run repeatedly in production.

### Development / testing only

These scripts add fake or test data. **Never run them in production.**

- `seed-admin.ts` — Extra admin/test users
- `seed-test-user.ts` — Test user accounts
- `seed-products.ts` — Loads products from a JSON file (dev catalog)
- `seed-gh-warehouses.ts` — Sample warehouses
- `seed-shipping-rates.ts` — Sample shipping rates

Run only against local or test databases, for example:

```bash
npx tsx database/seed.ts
npx tsx database/seed-products.ts   # dev only
```

## Real data in the app

The web app and API use only real data from the database. There is no simulation or fake data in the UI; empty states are shown when there is no data.
