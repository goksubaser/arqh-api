# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config and lockfile
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
COPY data ./data

# Install all dependencies (workspace hoisting)
RUN npm ci

# Build types and api
RUN npm run build -w types && npm run build -w api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/packages/types/dist packages/types/dist
COPY --from=builder /app/packages/types/package.json packages/types/package.json
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/package.json
COPY --from=builder /app/apps/api/public apps/api/public
COPY --from=builder /app/data /app/data

ENV NODE_ENV=production

WORKDIR /app/apps/api

EXPOSE 5052

CMD ["node", "dist/index.js"]
