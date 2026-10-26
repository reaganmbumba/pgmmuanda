#!/usr/bin/env bash
# Vérifie qu'une sauvegarde se restaure à l'identique dans une base neuve.
#   PGURL=postgres://postgres:motdepasse@localhost:5432/postgres bash supabase/tests/sauvegarde.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PGURL="${PGURL:-postgres://postgres@localhost:5432/postgres}"
A="pgm_sauve_a_$$"; B="pgm_sauve_b_$$"; TMP=$(mktemp -d)
trap 'psql "$PGURL" -qc "drop database if exists $A" -c "drop database if exists $B" >/dev/null; rm -rf "$TMP"' EXIT
for base in $A $B; do
  psql "$PGURL" -qc "create database $base"
  psql "${PGURL%/*}/$base" -q -v ON_ERROR_STOP=1 -f supabase/tests/00_stub_supabase.sql
  for f in supabase/migrations/*.sql; do psql "${PGURL%/*}/$base" -q -v ON_ERROR_STOP=1 -f "$f"; done
done
URL_A="${PGURL%/*}/$A"; URL_B="${PGURL%/*}/$B"
# Base A : les données des tests (comptes, membres, cartes, fichiers…) et le jeu de démonstration
for t in supabase/tests/[1-9]*.sql; do psql "$URL_A" -q -o /dev/null -v ON_ERROR_STOP=1 -f "$t" 2>/dev/null; done
psql "$URL_A" -q -o /dev/null -v ON_ERROR_STOP=1 -f supabase/seed-demo.sql
export PHRASE_SECRETE="phrase de test $$"
BASE_URL="$URL_A" bash scripts/sauvegarde.sh "$TMP" >/dev/null
SAUVEGARDE=$(ls "$TMP"/*.gpg)
if gunzip -c "$SAUVEGARDE" >/dev/null 2>&1 || grep -q "PGM-MUA" "$SAUVEGARDE"; then echo "ÉCHEC : la sauvegarde n'est pas chiffrée"; exit 1; fi
echo "OK : la sauvegarde est chiffrée (illisible sans la phrase secrète)"
if PHRASE_SECRETE="mauvaise" BASE_URL="$URL_B" bash scripts/restaurer.sh "$SAUVEGARDE" >/dev/null 2>&1; then echo "ÉCHEC : restaurée avec une mauvaise phrase"; exit 1; fi
echo "OK : une mauvaise phrase secrète est refusée"
BASE_URL="$URL_B" bash scripts/restaurer.sh "$SAUVEGARDE" >/dev/null
COMPTE="select string_agg(t || '=' || n, ' ' order by t) from (
  select c.relname::text t, (xpath('/row/n/text()', query_to_xml(format('select count(*) n from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text n
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind = 'r' and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))) x"
CA=$(psql "$URL_A" -qtA -c "$COMPTE"); CB=$(psql "$URL_B" -qtA -c "$COMPTE")
[ "$CA" = "$CB" ] || { echo "ÉCHEC : contenus différents"; diff <(tr ' ' '\n' <<<"$CA") <(tr ' ' '\n' <<<"$CB"); exit 1; }
echo "OK : toutes les tables sont restaurées à l'identique ($(tr ' ' '\n' <<<"$CA" | wc -l) tables)"
H="select md5(string_agg(contenu, '' order by id)) from public.documents"
[ "$(psql "$URL_A" -qtA -c "$H")" = "$(psql "$URL_B" -qtA -c "$H")" ] && echo "OK : les fichiers sont restaurés à l'octet près"
N1=$(psql "$URL_B" -qtA -c "select count(*) from public.notifications")
psql "$URL_B" -q -c "insert into public.membres (nom, prenom, paroisse_id) select 'Nouveau', 'Membre', id from public.paroisses limit 1"
M=$(psql "$URL_B" -qtA -c "select matricule from public.membres where nom = 'Nouveau'")
MAX=$(psql "$URL_A" -qtA -c "select max(matricule) from public.membres")
[[ "$M" > "$MAX" ]] && echo "OK : après restauration, les nouveaux matricules continuent la numérotation ($M)"
echo "Sauvegarde et restauration vérifiées."
