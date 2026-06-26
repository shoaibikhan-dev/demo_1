# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# ── Stage 2: Production Image (Distroless) ────────────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
USER 1001
EXPOSE 5001
ENV NODE_ENV=production
ENV PORT=5001
CMD ["server.js"]

