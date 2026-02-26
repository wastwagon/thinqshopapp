# ThinQShop Backend - Coolify/VPS ready
# Use Debian (slim) for both stages so Prisma generates correct binaries for OpenSSL 3.x
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo files (mobile excluded via .dockerignore)
COPY package.json package-lock.json ./
COPY backend/ ./backend/
COPY database/ ./database/
COPY web/lib/data/scraped_products.json ./database/scraped_products.json
COPY packages/ ./packages/

# Install all deps (needed for workspace resolution)
RUN npm ci

# Generate Prisma client (Debian/OpenSSL 3.x)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=database/schema.prisma

# Build backend
RUN npm run build -w backend

# Production stage
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7000

# Copy built app and runtime deps
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/database ./database

# Copy entrypoint
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 7000

ENTRYPOINT ["/docker-entrypoint.sh"]
