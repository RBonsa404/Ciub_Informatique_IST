#!/bin/sh
# Démarre le backend sur la base locale de recette (conteneur PostgreSQL publié sur le port 5433).
# Usage : sh e2e/backend-recette.sh    (depuis club-informatique-frontend)
# Variables facultatives : RECETTE_DB_URL, RECETTE_DB_USER, RECETTE_DB_PASSWORD, RECETTE_JWT_SECRET (base64).
# La limitation de débit est relevée pour permettre l'exécution répétée des scénarios ; jamais en production.
set -e
cd "$(dirname "$0")/../../club-informatique-backend"
: "${RECETTE_JWT_SECRET:?définir RECETTE_JWT_SECRET (chaîne base64 d'au moins 64 octets)}"
DB_URL="${RECETTE_DB_URL:-jdbc:postgresql://localhost:5433/club_informatique_dev}" \
DB_USERNAME="${RECETTE_DB_USER:-postgres}" \
DB_PASSWORD="${RECETTE_DB_PASSWORD:-postgres}" \
JWT_SECRET="$RECETTE_JWT_SECRET" \
SPRING_PROFILES_ACTIVE=dev \
mvn -B -q spring-boot:run -Dspring-boot.run.jvmArguments="-Dapp.rate-limit.auth.capacity=100000 -Dapp.rate-limit.auth.refill-tokens=100000 -Dlogging.level.org.hibernate.SQL=WARN -Dlogging.level.org.hibernate.type.descriptor.sql.BasicBinder=WARN -Dlogging.level.org.springframework.security=WARN"
