# BE DIFFERENT · Step 09 · Daily plan and human coach feedback

## Live product behavior
- Athlete web home and Expo home show only scheduled training for today, a strictly labelled empty schedule if no workout exists, actual daily check-in entries and observed sleep when present. There is no synthetic readiness score, fake recovery day or automatic AI coaching claim.
- The next scheduled session is linked to its own detailed workout page.
- Existing authenticated PRO video upload remains the entry point. The uploaded private TECHNIQUE_VIDEO is attached to a separate `CoachTechniqueReview` record with owner, optional source workout, immutable review author and timestamps. An explicit existing `media_processing` consent is still required by the upload API.
- Admin/Coach review queue includes only assigned athletes (admin sees all) and can play the athlete's private video via existing media authorization, send a concrete written review and optionally assign a next-session cue to a specific future unfinished workout.
- Session cues are displayed at the next workout in web and Expo without unapproved changes to sets, load, RPE or training prescriptions. An untargeted coach cue is shown on only the first upcoming session after its review time.
- Duplicate video attachments are idempotent. A review is immutable once accepted, and another coach cannot review an unassigned athlete.
- Existing chat messages remain available and the new review flow reuses rather than replaces the messaging and encrypted media subsystems.
- Cycle tracking observations do not silently modify training targets. Explicit athlete choice and trainer review are required for future adaptation.

## Endpoints
- `GET /api/step09/today`: strictly athlete-owned schedule, non-diagnostic observations, next coach guidance.
- `GET, POST /api/step09/technique`: athlete-owned private video reviews.
- `GET /api/admin/technique-reviews`: pending assigned-athlete coaching queue.
- `PATCH /api/admin/technique-reviews/[id]`: once-only authorized review with optional specific next-workout target.
- `GET /api/workouts/[id]`: existing workout plus authorized `coachCue` when enabled.
- Feature gate `STEP09_ENABLED=true` server-side (off by default). Native UI understands `EXPO_PUBLIC_STEP09_ENABLED=false` as an explicit off switch; server still controls authorization.

## Verification
- `scripts/test-journey-step09.mjs`: genuine vs invented training/rest distinction, owned private media, FREE/PRO access, coach assignment, future workout ownership, replay defense, immutability and cue integration.
- `tests/browser/step09-coach.spec.mjs`: athlete -> coach review -> next workout visibility and unassigned coach/anonymous denial on disposable PostgreSQL.
- Existing Journey progression tests and web/native build regressions remain part of CI.

## Correct production topology
**BE DIFFERENT is on the shared A+ Esthetic VPS**, isolated as systemd unit `bedifferent-temp`, code `/opt/bedifferent-temp/current`, data `/opt/bedifferent-temp/data`, PostgreSQL database `bedifferent_temp`, HTTP port `127.0.0.1:3100`. A+ Esthetic units `a-esthetic-mobile` and `aesthetic-book` share the host and must remain untouched. The Esthetic repository controls deployment with its existing `SERVER_HOST`, `SERVER_USER`, `SERVER_PORT` and `SERVER_SSH_KEY` credentials; unrelated Docker deployment from the BE DIFFERENT repository is permanently disabled.

Safe release requires full DB/data/env backup, read-only host and RAM checks, additive-only Prisma schema migration, separate systemd switch for BE DIFFERENT, health verification of all three systems and rollback of the application/env only if necessary. Do not overwrite existing athlete data, rewrite PRO subscriptions or regenerate old demo users.

## Production release gate
Server + schema readiness first, then refreshed app builds through Publisher. A code merge is not a live release; confirm the production readiness endpoint and actual systemd deployment before declaring activation.
