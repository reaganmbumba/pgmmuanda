#!/usr/bin/env bash
# Restaure une sauvegarde dans une base où toutes les migrations ont été exécutées, et qui est VIDE.
#   BASE_URL=postgresql://… PHRASE_SECRETE=… bash scripts/restaurer.sh pgm-sauvegarde-AAAA-MM-JJ.sql.gz.gpg
set -euo pipefail
: "${BASE_URL:?Indiquez BASE_URL (chaîne de connexion de la base à remplir)}"
: "${PHRASE_SECRETE:?Indiquez PHRASE_SECRETE (celle de la sauvegarde)}"
SAUVEGARDE="${1:?Indiquez le fichier de sauvegarde}"
gpg --batch --quiet --decrypt --passphrase-fd 3 "$SAUVEGARDE" 3<<<"$PHRASE_SECRETE" \
  | gunzip \
  | psql "$BASE_URL" -q -v ON_ERROR_STOP=1 --single-transaction \
      -c "set session_replication_role = replica" -f - >/dev/null
# « replica » : les déclencheurs (notifications, historique, matricules) ne sont pas rejoués.
psql "$BASE_URL" -qtA -c "select setval('public.matricule_seq', greatest(1, coalesce((select max(substring(matricule from 9)::int) from public.membres), 0)))" >/dev/null
echo "Restauration terminée : $(psql "$BASE_URL" -qtA -c 'select count(*) from public.membres') membres."
