# ThinQShop Web - Coolify/VPS ready
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo files (mobile excluded via .dockerignore)
COPY package.json package-lock.json ./
COPY web/ ./web/
COPY packages/ ./packages/

# Install all deps
RUN npm ci

# Build Next.js (args for build-time env vars)
ARG NEXT_PUBLIC_API_URL=http://localhost:7000
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=$NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_IGNORE_INCORRECT_LOCKFILE=1

RUN npm run build -w web

# Production stage
FROM node:20-alpine AS runner

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
