#!/usr/bin/env bash
# Test de bout en bout : Supabase local + application compilée + parcours dans le navigateur.
#   PGURL=postgres://postgres:postgres@localhost:5432/postgres npm run test:e2e
set -euo pipefail
cd "$(dirname "$0")/../.."
if curl -s -o /dev/null http://localhost:3000; then
  echo "Le port 3000 est déjà utilisé : arrêtez l'autre serveur avant le test." >&2; exit 1
fi
bash tests/e2e/supabase-local.sh
trap 'kill -- -$(cat .e2e/app.pid) 2>/dev/null || true; bash tests/e2e/supabase-local.sh stop' EXIT
set -a; . .e2e/env; set +a
npx next build > .e2e/build.log 2>&1 || { tail -30 .e2e/build.log; exit 1; }
setsid npx next start -p 3000 > .e2e/app.log 2>&1 & echo $! > .e2e/app.pid
for i in $(seq 1 60); do curl -sf http://localhost:3000/connexion >/dev/null && break; sleep 0.5; done
node tests/e2e/parcours.mjs
