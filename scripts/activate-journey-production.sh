#!/usr/bin/env bash
set -euo pipefail
# The production service is /opt/bedifferent-temp on the Esthetic VPS, not /opt/bedifferent.
echo "DEPRECATED: do not use the old Docker release path. Use the isolated Esthetic-host workflow." >&2
exit 1
ROOT=/opt/bedifferent
test -d "$ROOT/.git" && test -f "$ROOT/.env.production" && test -f "$ROOT/docker-compose.yml" || { echo "BLOCKED: unverified BE DIFFERENT installation" >&2; exit 1; }
docker inspect bedifferent-db --format '{{.State.Running}}' | grep -qx true || { echo "BLOCKED: database offline" >&2; exit 1; }
docker inspect bedifferent-web --format '{{.State.Running}}' | grep -qx true || { echo "BLOCKED: web offline" >&2; exit 1; }
curl -fsS --max-time 10 http://127.0.0.1:3100/api/ready >/dev/null || { echo "BLOCKED: previous release unready" >&2; exit 1; }
cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "BLOCKED: uncommitted production code" >&2; exit 1; }
git fetch --quiet origin main
git merge-base --is-ancestor HEAD origin/main || { echo "BLOCKED: diverged production branch" >&2; exit 1; }
old_web_image="$(docker inspect bedifferent-web --format '{{.Image}}')"
old_web_tag="$(docker inspect bedifferent-web --format '{{.Config.Image}}')"
mkdir -p /opt/bedifferent/backups && chmod 700 /opt/bedifferent/backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="/opt/bedifferent/backups/journey-$stamp"
mkdir -m 700 "$backup"
docker exec bedifferent-db pg_dump -U bedifferent -d bedifferent -Fc > "$backup/database.dump"
test "$(wc -c < "$backup/database.dump")" -gt 4096
[[ "$(head -c 5 "$backup/database.dump")" == "PGDMP" ]]
cp -p .env.production "$backup/env.production" && chmod 600 "$backup/env.production"
volume="$(docker inspect bedifferent-web --format '{{range .Mounts}}{{if eq .Destination "/app/data"}}{{.Name}}{{end}}{{end}}')"
test -n "$volume" || { echo "BLOCKED: media volume missing" >&2; exit 1; }
docker run --rm -v "$volume:/source:ro" -v "$backup:/dest" postgres:17-alpine sh -ec 'tar -czf /dest/media.tar.gz -C /source .'
test -s "$backup/media.tar.gz"
echo "BACKUP_VERIFIED $stamp"

rollback(){
  code=$?
  trap - ERR
  cp "$backup/env.production" "$ROOT/.env.production" || true
  chmod 600 "$ROOT/.env.production" || true
  docker tag "$old_web_image" "$old_web_tag" || true
  docker compose --env-file .env.production up -d --no-deps --no-build web || true
  echo "ROLLBACK_APP_FLAGS; DB backup retained: $backup/database.dump" >&2
  exit "$code"
}
trap rollback ERR
git merge --ff-only origin/main

set_flag(){
  key="$1"; value="$2"; tmp="$(mktemp)"
  grep -v "^${key}=" .env.production >"$tmp" || true
  printf '%s=%s\n' "$key" "$value" >>"$tmp"
  cat "$tmp" >.env.production && rm -f "$tmp" && chmod 600 .env.production
}
for name in JOURNEY_ONBOARDING_ENABLED JOURNEY_EDITOR_ENABLED JOURNEY_TESTS_ENABLED JOURNEY_OVERVIEW_ENABLED NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED NEXT_PUBLIC_JOURNEY_OVERVIEW_ENABLED; do
  set_flag "$name" true
done

docker compose --env-file .env.production build migrate web >/dev/null
docker compose --env-file .env.production run --rm --no-deps migrate sh -ec \
  'npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script' >"$backup/step08-sql.txt"
if grep -Eiq 'DROP[[:space:]]+(TABLE|COLUMN|TYPE)|ALTER[[:space:]]+TABLE[^;]*DROP|TRUNCATE|DELETE[[:space:]]+FROM' "$backup/step08-sql.txt"; then
  echo "BLOCKED: destructive schema diff" >&2
  false
fi
docker compose --env-file .env.production run --rm --no-deps migrate
docker compose --env-file .env.production up -d --no-deps --no-build web
for attempt in $(seq 1 35); do
  if curl -fsS --max-time 8 http://127.0.0.1:3100/api/ready >"$backup/readiness.json"; then break; fi
  sleep 2
done
test -s "$backup/readiness.json"
# Confirm BOTH runtime flags and Next.js build-time flags were actually enabled.
for feature in onboarding editor tests overview webOnboarding webOverview; do
  if ! grep -q "\"$feature\":true" "$backup/readiness.json"; then
    echo "BLOCKED: production feature $feature is not active" >&2
    false
  fi
done
for route in /api/journey/overview /api/journey/tests /api/admin/journeys /api/admin/journey-tests; do
  status="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:3100$route")"
  [[ "$status" == "401" || "$status" == "403" ]] || { echo "BLOCKED: unauthenticated $route returned $status" >&2; false; }
done
echo "BD_JOURNEY_ACTIVATED $(git rev-parse HEAD) BACKUP $stamp"
trap - ERR
