#!/usr/bin/env bash
# Lance les tests SQL sur une base PostgreSQL 15+ jetable.
# Usage : PGURL=postgres://postgres@localhost:5432/postgres supabase/tests/lancer.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PGURL="${PGURL:-postgres://postgres@localhost:5432/postgres}"
BASE="pgm_tests_$$"
psql "$PGURL" -qc "create database $BASE"
trap 'psql "$PGURL" -qc "drop database if exists $BASE" >/dev/null' EXIT
URL="${PGURL%/*}/$BASE"
psql "$URL" -q -v ON_ERROR_STOP=1 -f tests/00_stub_supabase.sql
for f in migrations/*.sql; do psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$URL" -q -t -o /dev/null -v ON_ERROR_STOP=1 -f tests/10_tests_securite.sql 2>&1 | sed "s/^psql:[^ ]* //"
# Le jeu de démonstration doit se charger sans erreur
psql "$URL" -q -v ON_ERROR_STOP=1 -f seed-demo.sql -o /dev/null
psql "$URL" -qtA -c "select 'Démo : ' || count(*) || ' membres, matricules ' || min(matricule) || ' à ' || max(matricule) from public.membres where est_demo"
