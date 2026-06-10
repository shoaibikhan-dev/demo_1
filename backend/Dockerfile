# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
RUN apk update && apk upgrade --no-cache
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 2: Production Image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
WORKDIR /usr/src/app
COPY --from=deps --chown=nodeuser:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .
RUN mkdir -p /usr/src/app/uploads && chown -R nodeuser:nodejs /usr/src/app/uploads
USER nodeuser
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
CMD ["dumb-init", "node", "server.js"]
