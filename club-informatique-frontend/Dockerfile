# Frontend du Club Informatique de l'IST : construction Angular, puis service par Nginx.
# Variables lues au démarrage du conteneur :
#   PORT     port d'écoute (fourni par l'hébergeur ; 8080 par défaut)
#   API_URL  adresse interne du backend, sans barre finale (exemple : http://backend.railway.internal:8080)

# ── Étape 1 : construction ──────────────────────────────────────────
FROM node:24-alpine AS construction
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run check && npm run build

# ── Étape 2 : service ───────────────────────────────────────────────
FROM nginx:1.29-alpine AS service
# Le gabarit est résolu au démarrage par l'image officielle (envsubst), pour les seules variables listées.
# Les serveurs de noms du conteneur sont transmis au gabarit : l'adresse du backend est résolue de nouveau à intervalles courts.
ENV PORT=8080 \
    API_URL=http://localhost:8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(PORT|API_URL|NGINX_LOCAL_RESOLVERS)$"
COPY deploiement/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploiement/en-tetes.conf /etc/nginx/snippets/en-tetes.conf
COPY --from=construction /app/dist/club-informatique-frontend/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/sante" || exit 1
