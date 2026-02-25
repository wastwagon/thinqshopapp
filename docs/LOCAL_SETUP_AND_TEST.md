# Local setup and test (before commit & deploy)

## 1. One-time setup (command prompt / terminal)

**Windows (Command Prompt):**
```cmd
cd path\to\thinqshop-world-class
scripts\setup.cmd
```

**macOS / Linux:**
```bash
cd /path/to/thinqshop-world-class
./scripts/setup.sh
```

This will:
- Copy `.env.example` to `.env` if `.env` is missing
- Run `npm install`
- Run `npx prisma generate --schema=database/schema.prisma`
- Run `npx prisma migrate deploy` (requires PostgreSQL running and `DATABASE_URL` in `.env`)

**Required in `.env`:**
- `DATABASE_URL` – PostgreSQL connection string (e.g. local or Docker on port 5440)
- `JWT_SECRET` – any secret string (backend will not start without it)

Optional: `FRONTEND_URL`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `SENTRY_DSN`, SMTP vars for email queue.

---

## 2. Run backend and web locally

**Terminal 1 – Backend:**
```bash
npm run dev:backend
```
Backend: http://localhost:7000  
Swagger: http://localhost:7000/api/docs

**Terminal 2 – Web:**
```bash
npm run dev:web
```
Web: http://localhost:7001 (or port in `web/package.json`)

---

## 3. Test before commit & deploy

From the project root:

```bash
npm run test:local
```

This runs:
1. `npm run build -w backend`
2. `npm run test -w backend` (unit tests)
3. `npm run build -w web`

All three must succeed before you commit, push, and deploy.

---

## 4. Optional: process email queue

If you use the email queue and have SMTP configured in `.env`:

```bash
npm run email:process
```

---

## 5. Then commit, push, and deploy

After `npm run test:local` passes:

1. Commit your changes.
2. Push to GitHub (e.g. `main`).
3. Deploy (e.g. with Docker Compose or Coolify).
4. Set `FRONTEND_URL` on the backend service to your web URL.
5. Run migrations on production (backend runs them in the start command).
