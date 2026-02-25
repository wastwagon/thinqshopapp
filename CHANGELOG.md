# Changelog

## [1.0.0-alpha.1] - 2026-02-23

### Added

- `npm run build:web:docker` and `npm run build:backend:docker`
- `npm run clean` to remove stale build output

### Changed

- Next.js image optimization re-enabled (removed `images.unoptimized`)
- Migration failures now fail container start (removed `|| true` in entrypoint)
- `dynamicImport` renamed to `dynamic` from `next/dynamic`
- `.env.example` updated with env override notes

### Removed

- `force-dynamic` from root layout (restored static generation via isolated build)
- Dead commented imports (`PaymentModule`, `WalletModule`, `AdminModule`) from `app.module.ts`
- Explicit `styled-jsx` from web deps (Next.js includes it)

---

## [1.0.0-alpha.0] - 2026-02-19

- Initial monorepo setup
- NestJS backend, Next.js web, Expo mobile
