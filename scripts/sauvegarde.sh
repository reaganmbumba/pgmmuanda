#!/usr/bin/env bash
# Sauvegarde chiffrée des données de la PGM (membres, cartes, fichiers, comptes…).
#   BASE_URL=postgresql://… PHRASE_SECRETE=… bash scripts/sauvegarde.sh [dossier]
# Produit pgm-sauvegarde-AAAA-MM-JJ.sql.gz.gpg : illisible sans la phrase secrète.
set -euo pipefail
: "${BASE_URL:?Indiquez BASE_URL (chaîne de connexion de la base)}"
: "${PHRASE_SECRETE:?Indiquez PHRASE_SECRETE (pour chiffrer la sauvegarde)}"
DOSSIER="${1:-.}"
FICHIER="$DOSSIER/pgm-sauvegarde-$(date -u +%Y-%m-%d).sql.gz.gpg"
# Données seulement (la structure vient des migrations) : schéma public et comptes de connexion
pg_dump "$BASE_URL" --data-only --no-owner --no-privileges \
  --table='public.*' --table=auth.users --table=auth.identities \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-fd 3 --output "$FICHIER" 3<<<"$PHRASE_SECRETE"
echo "Sauvegarde créée : $FICHIER ($(du -h "$FICHIER" | cut -f1))"
