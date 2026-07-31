# ── Compilación ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run test && npm run build

# ── Servido ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS run

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck explícitamente por IPv4: "localhost" en Alpine resuelve primero a
# ::1 y si nginx no escucha en IPv6 devuelve "connection refused" sin fallback.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1
