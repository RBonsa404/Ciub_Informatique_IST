#!/bin/sh
# ===================================================================
# Sauvegarde de la base du Club Informatique de l'IST (PostgreSQL)
#
# Produit un fichier au format « custom » de pg_dump (compressé, restaurable table par table)
# et inscrit le résultat dans la table « sauvegarde », que lit l'écran du Super Admin.
#
# Connexion : variables standard de PostgreSQL (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
# Réglages  : DOSSIER_SAUVEGARDES (défaut ./sauvegardes), RETENTION_JOURS (défaut 30).
#
# Usage : PGHOST=… PGUSER=… PGPASSWORD=… PGDATABASE=… ./sauvegarde.sh
# ===================================================================
set -u

: "${PGDATABASE:?PGDATABASE est obligatoire}"
DOSSIER="${DOSSIER_SAUVEGARDES:-./sauvegardes}"
RETENTION="${RETENTION_JOURS:-30}"
HORODATAGE="$(date -u +%Y%m%d-%H%M%S)"
FICHIER="$DOSSIER/club-$HORODATAGE.dump"

mkdir -p "$DOSSIER" || exit 1

if pg_dump --format=custom --no-owner --no-privileges --file="$FICHIER" 2>"$FICHIER.erreur"; then
    TAILLE="$(wc -c < "$FICHIER" | tr -d ' ')"
    rm -f "$FICHIER.erreur"
    psql --quiet --no-psqlrc -v ON_ERROR_STOP=1 \
         -c "INSERT INTO sauvegarde (taille_octets, statut, detail) VALUES ($TAILLE, 'REUSSIE', '$(basename "$FICHIER")')" || exit 1
    # Les sauvegardes plus anciennes que la durée de conservation sont retirées.
    find "$DOSSIER" -name 'club-*.dump' -type f -mtime +"$RETENTION" -exec rm -f {} \;
    echo "Sauvegarde réussie : $FICHIER ($TAILLE octets)"
else
    DETAIL="$(head -c 400 "$FICHIER.erreur" | tr -d "'" | tr '\n' ' ')"
    rm -f "$FICHIER" "$FICHIER.erreur"
    psql --quiet --no-psqlrc -c "INSERT INTO sauvegarde (statut, detail) VALUES ('ECHOUEE', '$DETAIL')"
    echo "Sauvegarde échouée : $DETAIL" >&2
    exit 1
fi
