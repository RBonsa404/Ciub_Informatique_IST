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

# Install envsubst (part of gettext, usually already in nginx:alpine)
RUN apk add --no-cache gettext

# Copy the Nginx config template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy built Angular static assets to Nginx html folder
# Note: @angular/build:application outputs to dist/club-informatique-frontend/browser
COPY --from=builder /app/dist/club-informatique-frontend/browser /usr/share/nginx/html

# Expose default port
EXPOSE 80

# Substitute $PORT at startup then launch Nginx
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
