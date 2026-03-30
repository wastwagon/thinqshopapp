# ThinQShop Web - Coolify/VPS ready
# Use Debian (slim) so sharp binaries match runner (Alpine/musl breaks sharp in standalone)
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo files (mobile excluded via .dockerignore)
COPY package.json package-lock.json ./
COPY web/ ./web/
COPY packages/ ./packages/

# Install all deps (retry on transient network errors e.g. ECONNRESET from registry)
RUN for i in 1 2 3; do npm ci && break; sleep 15; done

# Build Next.js (args for build-time env vars; Coolify passes these as --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:7000
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=$NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER=$NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_IGNORE_INCORRECT_LOCKFILE=1

RUN npm run build -w web

# Production stage - use Debian (slim) for sharp compatibility (Alpine/musl often fails)
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone output (monorepo: server.js at web/server.js)
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public

EXPOSE 3000

WORKDIR /app/web
CMD ["node", "server.js"]
