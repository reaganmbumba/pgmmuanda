#!/usr/bin/env bash
# Démarre une copie locale de Supabase (Auth + API REST) sur PostgreSQL,
# pour tester l'application de bout en bout sans toucher au vrai projet.
#
#   PGURL=postgres://postgres:postgres@localhost:5432/postgres bash tests/e2e/supabase-local.sh
#
# Écrit .e2e/env (variables pour Next.js) et laisse les services tourner.
# Arrêt : bash tests/e2e/supabase-local.sh stop
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
DOSSIER="$RACINE/.e2e"
mkdir -p "$DOSSIER"

if [[ "${1:-}" == "stop" ]]; then
  for f in "$DOSSIER"/*.pid; do [[ -f "$f" ]] && kill "$(cat "$f")" 2>/dev/null || true; rm -f "$f"; done
  exit 0
fi

: "${PGURL:?Définir PGURL (connexion superutilisateur PostgreSQL)}"
BASE=pgm_e2e
HOTE_PG="$(node -e 'const u=new URL(process.argv[1]);console.log(`${u.hostname}:${u.port||5432}`)' "$PGURL")"
URL_BASE="$(node -e 'const u=new URL(process.argv[1]);u.pathname="/'$BASE'";console.log(u.href)' "$PGURL")"
SECRET="e2e-secret-local-uniquement-0123456789abcdef"

# Binaires
cd "$DOSSIER"
if [[ ! -x postgrest ]]; then
  curl -sSL https://github.com/PostgREST/postgrest/releases/download/v12.2.3/postgrest-v12.2.3-linux-static-x64.tar.xz | tar xJ
fi
if [[ ! -x auth ]]; then
  curl -sSL https://github.com/supabase/auth/releases/download/v2.177.0/auth-v2.177.0-x86.tar.gz | tar xz
fi

# Base neuve avec les rôles de Supabase
psql "$PGURL" -q -v ON_ERROR_STOP=1 <<SQL
drop database if exists $BASE with (force);
create database $BASE;
do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select from pg_roles where rolname='authenticator') then create role authenticator login noinherit password 'e2e'; end if;
  if not exists (select from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin login createrole password 'e2e'; end if;
end \$\$;
grant anon, authenticated, service_role to authenticator;
SQL
psql "$URL_BASE" -q -v ON_ERROR_STOP=1 <<SQL
create schema auth authorization supabase_auth_admin;
alter role supabase_auth_admin in database $BASE set search_path = auth;
create schema extensions;
create extension pgcrypto schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
-- Droits par défaut d'un projet supabase.co
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
SQL

URL_AUTH="$(node -e 'const u=new URL(process.argv[1]);u.username="supabase_auth_admin";u.password="e2e";console.log(u.href)' "$URL_BASE")"
URL_API="$(node -e 'const u=new URL(process.argv[1]);u.username="authenticator";u.password="e2e";console.log(u.href)' "$URL_BASE")"

# Supabase Auth crée le schéma auth (auth.users, auth.uid()...)
export GOTRUE_API_HOST=127.0.0.1 PORT=54390 API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1
export GOTRUE_DB_DRIVER=postgres DATABASE_URL="$URL_AUTH" GOTRUE_DB_NAMESPACE=auth
export GOTRUE_SITE_URL=http://localhost:3000 GOTRUE_URI_ALLOW_LIST="http://localhost:3000/**"
export GOTRUE_JWT_SECRET="$SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated
export GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated GOTRUE_JWT_ADMIN_ROLES=service_role
export GOTRUE_DISABLE_SIGNUP=true GOTRUE_EXTERNAL_EMAIL_ENABLED=true GOTRUE_MAILER_AUTOCONFIRM=true
export GOTRUE_SMTP_HOST=127.0.0.1 GOTRUE_SMTP_PORT=2500 GOTRUE_SMTP_ADMIN_EMAIL=pgm@example.org
export GOTRUE_RATE_LIMIT_EMAIL_SENT=1000
./auth > auth.log 2>&1 & echo $! > auth.pid
for i in $(seq 1 60); do curl -sf http://127.0.0.1:54390/health >/dev/null && break; sleep 0.5; done
curl -sf http://127.0.0.1:54390/health >/dev/null || { cat auth.log; exit 1; }

# Migrations de l'application
for f in "$RACINE"/supabase/migrations/*.sql; do psql "$URL_BASE" -q -v ON_ERROR_STOP=1 -f "$f"; done

# API REST
cat > postgrest.conf <<CONF
db-uri = "$URL_API"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-host = "127.0.0.1"
server-port = 54391
CONF
./postgrest postgrest.conf > postgrest.log 2>&1 & echo $! > postgrest.pid

# Point d'entrée unique comme sur supabase.co
node "$RACINE/tests/e2e/passerelle.mjs" > passerelle.log 2>&1 & echo $! > passerelle.pid
for i in $(seq 1 40); do curl -sf http://127.0.0.1:54321/rest/v1/ >/dev/null 2>&1 && break; sleep 0.5; done

CLES="$(node "$RACINE/tests/e2e/cles.mjs" "$SECRET")"
cat > env <<ENV
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
$CLES
ENV
echo "Supabase local prêt : http://127.0.0.1:54321 (variables dans .e2e/env)"
