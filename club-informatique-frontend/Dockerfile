# ===================================================================
# Club Informatique IST — Frontend Angular Dockerfile (Multi-Stage)
# ===================================================================
# Stage 1: Build Angular static assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full frontend source code
COPY . .

# Build production Angular bundle
RUN npm run build

# ── Stage 2: Serve static files with Nginx ──────────────────────────
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (listens on port 80)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

# Copy built Angular static assets to Nginx html folder
# Note: @angular/build:application outputs to dist/club-informatique-frontend/browser
COPY --from=builder /app/dist/club-informatique-frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
