# ─── Stage 1 : Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/
COPY benchmark/ ./benchmark/
COPY templates/ ./templates/
COPY swagger.json ./

RUN npm run build

# ─── Stage 2 : Production ──────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache fontconfig freetype && rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates
COPY swagger.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001 -G nodejs

USER nodeapp

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]