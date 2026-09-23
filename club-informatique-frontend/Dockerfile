# ===================================================================
# Club Informatique IST — Frontend Angular Dockerfile (Multi-Stage)
# ===================================================================
# Stage 1: Build Angular static assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci --legacy-peer-deps

# Copy full frontend source code
COPY . .

# Build production Angular bundle with environment.prod.ts
RUN npm run build

# ── Stage 2: Serve static files with Nginx ──────────────────────────
FROM nginx:alpine AS runtime

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config template (BACKEND_URL will be substituted at startup)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built Angular static assets to Nginx html folder
COPY --from=builder /app/dist/club-informatique-frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# At startup: substitute BACKEND_URL env var into nginx config, then launch nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
