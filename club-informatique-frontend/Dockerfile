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

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy Nginx template and entrypoint script
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built Angular static assets to Nginx html folder
COPY --from=builder /app/dist/club-informatique-frontend/browser /usr/share/nginx/html

# Expose port (overridden at runtime by $PORT)
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
