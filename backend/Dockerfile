# Build stage - uses isolated backend-only workspace for smaller image
FROM node:20-alpine AS builder

WORKDIR /app

# Use backend-only package.json to avoid pulling web/mobile
COPY package.backend-build.json ./package.json
COPY backend/ ./backend/
COPY database/ ./database/

# Install dependencies (backend workspace only)
RUN npm install

# Generate Prisma client (schema in database/)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=database/schema.prisma

# Build backend
RUN npm run build -w backend

# Production stage (Debian for Prisma/OpenSSL compatibility)
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7000

# Copy built app, node_modules (hoisted from monorepo root), and database
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/database ./database

# Copy entrypoint
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 7000

ENTRYPOINT ["/docker-entrypoint.sh"]
