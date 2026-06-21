# ── Stage 1: Build the React Application ──
FROM node:20-alpine AS build
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Serve via Nginx ──────────────
FROM nginx:alpine
RUN apk update && apk upgrade --no-cache
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Setup non-root execution permissions for user 101
RUN touch /var/run/nginx.pid && \
    chown -R 101:101 /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER 101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
