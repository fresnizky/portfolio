# Production Dockerfile for Backend
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (ignore postinstall, prisma generate runs after COPY)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (ignore postinstall, prisma generate runs separately below)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy Prisma schema, migrations, and config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Generate Prisma client (using dlx since prisma is a devDependency)
RUN pnpm dlx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
