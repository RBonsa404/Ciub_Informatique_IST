#!/bin/sh
# ===================================================================
# Restauration de la base du Club Informatique de l'IST à partir d'une sauvegarde
#
# ATTENTION : le contenu de la base visée (PGDATABASE) est remplacé par celui de la sauvegarde.
# L'application doit être arrêtée pendant l'opération.
#
# Connexion : variables standard de PostgreSQL (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
#
# Usage : CONFIRMER=oui PGDATABASE=… ./restauration.sh sauvegardes/club-AAAAMMJJ-HHMMSS.dump
# ===================================================================
set -u

FICHIER="${1:?Usage : restauration.sh <fichier de sauvegarde>}"
: "${PGDATABASE:?PGDATABASE est obligatoire}"

if [ ! -f "$FICHIER" ]; then
    echo "Fichier introuvable : $FICHIER" >&2
    exit 1
fi
if [ "${CONFIRMER:-}" != "oui" ]; then
    echo "La base « $PGDATABASE » va être remplacée. Relancez avec CONFIRMER=oui pour continuer." >&2
    exit 1
fi

pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction --dbname="$PGDATABASE" "$FICHIER" || {
    echo "Restauration échouée : la base n'a pas été modifiée (transaction annulée)." >&2
    exit 1
}

echo "Restauration terminée. Contenu de la base « $PGDATABASE » :"
psql --quiet --no-psqlrc --tuples-only -c "
    SELECT 'migrations appliquées : ' || COUNT(*) FROM flyway_schema_history WHERE success
    UNION ALL SELECT 'comptes : ' || COUNT(*) FROM utilisateur
    UNION ALL SELECT 'formations : ' || COUNT(*) FROM formation
    UNION ALL SELECT 'événements : ' || COUNT(*) FROM evenement
    UNION ALL SELECT 'inscriptions : ' || COUNT(*) FROM inscription
    UNION ALL SELECT 'projets : ' || COUNT(*) FROM projet"
