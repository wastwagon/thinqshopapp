# Build stage - uses isolated web-only workspace to avoid React version conflicts
# (monorepo with mobile pulls React Native's React; isolated build ensures single React instance)
FROM node:20-alpine AS builder

WORKDIR /app

# Use web-only package.json to avoid pulling mobile/backend (prevents dual React instances)
COPY package.web-build.json ./package.json
COPY web/ ./web/

# Install dependencies (web workspace only - no mobile/backend)
RUN npm install

# Build Next.js (NEXT_PUBLIC_* baked in at build time)
WORKDIR /app/web
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:7000
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=$NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone (workspace may nest server in .next/standalone/web)
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./.next/static
COPY --from=builder /app/web/public ./public

EXPOSE 3000

# Run server.js from wherever it is in the standalone tree
CMD ["sh", "-c", "S=$(find /app -name server.js -type f 2>/dev/null | head -1); [ -n \"$S\" ] && cd \"$(dirname \"$S\")\" && exec node server.js || exec node server.js"]
