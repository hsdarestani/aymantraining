#!/usr/bin/env bash
# Deploy only BE DIFFERENT on Esthetic's existing systemd VPS.
set -Eeuo pipefail
APP=/opt/bedifferent-temp
ENVFILE=/etc/bedifferent-temp.env
SERVICE=bedifferent-temp
test $# -eq 2
EXPECTED_SHA="$1"
REL="$APP/releases/$2"
BACKUP="$APP/backups/journey-$(date -u +%Y%m%dT%H%M%SZ)"
OLD=""
phase=preflight
rollback(){
  rc=$?
  trap - ERR
  echo "BD_RELEASE_ROLLBACK phase=$phase" >&2
  if [ -f "$BACKUP/env" ]; then cp -p "$BACKUP/env" "$ENVFILE" || true; fi
  if [ -n "$OLD" ] && [ -s "$OLD/server.js" ]; then
    ln -sfn "$OLD" "$APP/current.rollback"
    mv -Tf "$APP/current.rollback" "$APP/current"
    systemctl restart "$SERVICE" || true
  fi
  echo "BD_BACKUP_RETAINED=$BACKUP" >&2
  exit "$rc"
}
trap rollback ERR
test "$(id -u)" -eq 0
test -d /opt/a-esthetic-mobile && test -d /opt/aesthetic-book
test -L "$APP/current" && test -s "$ENVFILE"
test -s "$REL/server.js" && test -x "$REL/bin/node"
test "$(cat "$REL/.source-sha")" = "$EXPECTED_SHA"
OLD="$(readlink -f "$APP/current")"
case "$OLD" in "$APP"/releases/*) ;; *) echo "UNEXPECTED_CURRENT_RELEASE" >&2; false;; esac
for svc in a-esthetic-mobile aesthetic-book postgresql nginx "$SERVICE"; do systemctl is-active --quiet "$svc"; done
test "$(runuser -u postgres -- psql -tAc "SELECT count(*) FROM pg_database WHERE datname='bedifferent_temp'")" = 1
curl -fsS --max-time 9 http://127.0.0.1:3100/api/ready >/dev/null
curl -fsS --max-time 9 http://127.0.0.1:8770/api/mobile/status/ >/dev/null
curl -fsS --max-time 9 http://127.0.0.1:8017/api/health/ >/dev/null
test "$(awk '/MemAvailable/ {print $2}' /proc/meminfo)" -ge 900000
test "$(df -Pk "$APP" | awk 'NR==2{print $4}')" -ge 1800000
mkdir -p "$APP/backups"
chmod 700 "$APP/backups"
umask 077
mkdir -m 700 "$BACKUP"
phase=backup
runuser -u postgres -- pg_dump -Fc -d bedifferent_temp > "$BACKUP/db.dump"
test "$(wc -c < "$BACKUP/db.dump")" -gt 4096
test "$(head -c 5 "$BACKUP/db.dump")" = PGDMP
cp -p "$ENVFILE" "$BACKUP/env"
test -d "$APP/data"
tar -czf "$BACKUP/media.tgz" -C "$APP" data
test -s "$BACKUP/media.tgz"
echo BD_DB_ENV_MEDIA_BACKUP_VERIFIED
phase=schema
set -a; . "$ENVFILE"; set +a
case "$DATABASE_URL" in *"/bedifferent_temp"*) ;; *) echo "BLOCKED: wrong database" >&2; false;; esac
test -s "$REL/prisma/schema.prisma"
test -s "$REL/node_modules/prisma/build/index.js"
runuser -u bedifferenttemp -- env DATABASE_URL="$DATABASE_URL" "$REL/bin/node" \
 "$REL/node_modules/prisma/build/index.js" migrate diff --from-url "$DATABASE_URL" \
 --to-schema-datamodel "$REL/prisma/schema.prisma" --script > "$BACKUP/plan.sql"
if grep -Eiq 'DROP |TRUNCATE |DELETE FROM|ALTER TABLE .*SET NOT NULL' "$BACKUP/plan.sql"; then
 echo "BLOCKED: destructive or unsafe schema plan" >&2; false
fi
phase=migration
runuser -u bedifferenttemp -- env DATABASE_URL="$DATABASE_URL" "$REL/bin/node" \
 "$REL/node_modules/prisma/build/index.js" db push --skip-generate
runuser -u bedifferenttemp -- env DATABASE_URL="$DATABASE_URL" "$REL/bin/node" \
 "$REL/scripts/backfill-published-journey-snapshots.mjs"
phase=flags
# Ensure all new additive models from steps 11–13 exist before enabling routes.
new_tables="$(runuser -u postgres -- psql -d bedifferent_temp -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ('AthleteDashboardPreference','CyclePrivacy','CycleJournalEntry','PlannedRecoveryDay','MilestoneRule','MilestoneAward','CelebrationPreference')")"
test "$new_tables" = 7
for key in JOURNEY_ONBOARDING_ENABLED JOURNEY_EDITOR_ENABLED JOURNEY_TESTS_ENABLED JOURNEY_OVERVIEW_ENABLED JOURNEY_DAILY_ENABLED NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED NEXT_PUBLIC_JOURNEY_OVERVIEW_ENABLED WOMEN_DASHBOARD_ENABLED CYCLE_JOURNAL_ENABLED MILESTONES_ENABLED CELEBRATIONS_ENABLED; do
  sed -i "/^$key=/d" "$ENVFILE"
  printf '%s=true\n' "$key" >> "$ENVFILE"
done
chown root:bedifferenttemp "$ENVFILE"
chmod 0640 "$ENVFILE"
phase=switch
ln -sfn "$REL" "$APP/current.next"
mv -Tf "$APP/current.next" "$APP/current"
systemctl restart "$SERVICE"
phase=verify
ready=0
for attempt in $(seq 1 35); do
 if curl -fsS --max-time 5 http://127.0.0.1:3100/api/ready > "$BACKUP/ready.json" 2>/dev/null; then
  if grep -q '"daily":true' "$BACKUP/ready.json" &&
    grep -q '"overview":true' "$BACKUP/ready.json" &&
    grep -q '"tests":true' "$BACKUP/ready.json" &&
    grep -q '"editor":true' "$BACKUP/ready.json" &&
    grep -q '"onboarding":true' "$BACKUP/ready.json" &&
    grep -q '"womenDashboard":true' "$BACKUP/ready.json" &&
    grep -q '"cycleJournal":true' "$BACKUP/ready.json" &&
    grep -q '"milestones":true' "$BACKUP/ready.json" &&
     grep -q '"celebrations":true' "$BACKUP/ready.json"; then ready=1; break; fi
 fi
 sleep 2
done
test "$ready" -eq 1
for route in /api/journey/overview /api/journey/tests /api/journey/daily /api/admin/journeys /api/admin/journey-videos /api/dashboard-preference /api/cycle /api/milestones /api/milestones/coach /api/celebrations; do
 code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:3100$route")"
 test "$code" = 401 || test "$code" = 403
done
for svc in a-esthetic-mobile aesthetic-book postgresql nginx "$SERVICE"; do systemctl is-active --quiet "$svc"; done
curl -fsS --max-time 10 http://127.0.0.1:8770/api/mobile/status/ >/dev/null
curl -fsS --max-time 10 http://127.0.0.1:8017/api/health/ >/dev/null
test "$(readlink -f "$APP/current")" = "$REL"
echo "BD_SHARED_HOST_ACTIVATED_SHA=$EXPECTED_SHA"
echo "BD_PRIVATE_BACKUP=$BACKUP"
trap - ERR
