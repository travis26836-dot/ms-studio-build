# syntax=docker/dockerfile:1
# Multi-stage build for Node.js/React/Express app with pnpm

# ============================================================================
# Build Stage: Compile TypeScript, bundle assets, generate Prisma client
# ============================================================================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build tools and pnpm globally
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@10.4.1

# Copy dependency files (cache layer)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (use BuildKit cache mount to avoid re-downloading on every build)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy project source after dependencies (improves cache hit rate)
COPY . .

# Generate Prisma client and build application
RUN pnpm prisma:generate && pnpm build

# ============================================================================
# Production Stage: Lightweight runtime image
# ============================================================================
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Prisma requires OpenSSL in runtime for migration/client engine loading
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (before copying files)
RUN groupadd -g 1001 nodejs && useradd -m -u 1001 -g nodejs nodejs

# Copy built artifacts and configuration from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Switch to non-root user
USER nodejs

# Health check for service availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose ports (client on 3000, API on 3010)
EXPOSE 3000 3010

# Run pending DB migrations then start the app
CMD ["sh", "-c", "export DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres@db:5432/ms_studio}; ./node_modules/.bin/prisma migrate deploy && node dist/index.js"]
