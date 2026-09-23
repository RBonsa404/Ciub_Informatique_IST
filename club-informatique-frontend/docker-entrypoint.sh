#!/bin/sh
set -e

# Default port to 80 if not set by Railway ($PORT)
export PORT="${PORT:-80}"

# Default backend URL to Railway internal private networking if not explicitly set
export BACKEND_URL="${BACKEND_URL:-http://club-informatique-backend.railway.internal:8080/api/}"

echo "Starting Nginx on port ${PORT}, proxying /api/ to ${BACKEND_URL}..."

# Substitute only PORT and BACKEND_URL in template to avoid breaking Nginx $uri variables
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
