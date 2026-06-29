# ---- Stage 1: install ALL dependencies (including dev) ----
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

# ---- Stage 2: build the Next.js application ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Stage 3: production runtime ----
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:./prisma/data/prod.db

# Install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema + generated client for migrate deploy at runtime
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts
COPY --from=deps /app/src/generated ./src/generated

# Copy built Next.js output
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./

# Create non-root user and data directory
RUN groupadd --gid 1001 nextjs && \
    useradd --uid 1001 --gid nextjs --shell /bin/bash --create-home nextjs && \
    mkdir -p /app/prisma/data && \
    chown -R nextjs:nextjs /app/prisma/data /app/.next /app/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/login || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node node_modules/next/dist/bin/next start -p ${PORT}"]
