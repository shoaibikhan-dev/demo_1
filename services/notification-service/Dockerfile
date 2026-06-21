# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
RUN apk update && apk upgrade --no-cache
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 2: Production Image (Distroless) ────────────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
USER 1001
EXPOSE 5003
ENV NODE_ENV=production
ENV PORT=5003
CMD ["server.js"]
