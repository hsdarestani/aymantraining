# BE DIFFERENT – Step 08 security and controlled production activation
Date: October 22, 2026

## Security boundary

**Legacy content**
- A legacy exercise video is no longer anonymously available from `GET /api/media/[id]`. A FREE athlete cannot stream it even if a previously cached API response reveals the old route. Authorized PRO/ELITE users can stream only media still tied to an active exercise in the library, a relevant assignment or a workout. Admins and owning coaches can inspect.
- FREE exercise list, individual exercise, templates and media preload no longer advertise legacy PRO video URLs. Existing FREE guidance and exercise photos remain readable; this does **not** delete or censor the existing library.
- An asset uploaded under the `journey-media/` namespace can never be linked into a public legacy Exercise through the coach's legacy media assignment endpoint.
- Newly uploaded Journey images and 8–12 second PRO explanation clips are encrypted at rest by the existing private storage mechanism. Their download routes require real entitlement and earned chapter checks even for HTTP range responses. Cache headers for protected media are `private, no-store`.
- Coaches may preview chapter media only if they own it; admins retain global administrative access. An athlete must have an ACTIVE/FINISHED enrollment for the matching version, a persisted chapter grant and the media subscription entitlement. A guessable media ID is not sufficient.

**Frozen versions**
- Publication now snapshots the legacy Exercise/TrainingPlan display data and plan item instructions into each published JourneyChapterItem (nullable `publishedSnapshot` JSON column). Updating the mutable legacy Exercise/TrainingPlan later does not alter the coach-approved version.
- For any previously published chapter items, the migration fills missing snapshots **once** from their current legacy reference. Because no historical immutable source existed before Step 08, earlier modifications cannot be reconstructed retroactively. The backfill never changes existing snapshots or an athlete's unlock ledger.
- The new reader never falls back to mutable Exercise/TrainingPlan records when a snapshot is absent.

## No data loss

Production migration no longer uses `prisma db push --accept-data-loss`, does not reseed demo users and does not execute hstest preview jobs. Prisma applies additive-compatible changes only and refuses destructive schema changes. Before activation, the rollout runs a full `pg_dump -Fc` plus private media volume archive and `.env.production` backup. It rejects unsafe SQL before applying migration. The backup directory is owned by root at `/opt/bedifferent/backups/journey-YYYYmmddTHHMMSSZ`. On application verification failure it restores the previous application image and flags; the pre-migration DB backup remains available for controlled recovery (automated DB restore is intentionally not performed, to avoid rolling back legitimate user activity).

Production activation runs **only** after the green Step 08 QA workflow on `main`. The SSH script changes only the existing `/opt/bedifferent` repository, containers named `bedifferent-*` and its environment; it never installs packages, restarts nginx, alters ports or touches A+ Solution / Esthetic containers. A dirty checkout, missing existing service, missing media volume, failed backup, destructive schema diff, unsuccessful migration or readiness failure blocks activation.

All six required flags will be written true on successful activation:
`JOURNEY_ONBOARDING_ENABLED`, `NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED`,
`JOURNEY_EDITOR_ENABLED`, `JOURNEY_TESTS_ENABLED`,
`JOURNEY_OVERVIEW_ENABLED`, `NEXT_PUBLIC_JOURNEY_OVERVIEW_ENABLED`.
The web app rebuilds with the public flags. New native builds (1.2.9 build 20) opt into Journey onboarding, exam UI and map; older store binaries retain prior behavior. The Publisher's Android and iOS release is queued **only if deployment and post-activation checks pass**.

## Validation

`.github/workflows/step08-security.yml` checks:
- TypeScript/Prisma, additive schema migration from previous main, preservation of historic user data and published version rows
- Step 08 video gate, own/locked chapter media and snapshot immutability
- Previous Steps 3, 5, 7 domain regressions
- production Next.js build and native TypeScript
- safe production shell syntax and absence of demo seeding / data-loss migration.

`.github/workflows/journey-production-activation.yml` checks the tested SHA is still latest main, takes verified DB/media/env backups, rejects destructive live SQL, enables flags, deploys only web, checks four unauthorized endpoints return 401/403 and public readiness, then queues the native builds.

## Important remaining content dependency

Feature activation does **not** create or approve assessment thresholds, filming or training pathways on Ashkan's behalf. If no coach-approved Journey has been published, new users remain `PENDING_PATHWAY`. The Coach editor is available for building content, but PRO purchases do not bypass chapter tests. Any existing externally hosted exercise videos or copies cached before the new access checks cannot be revoked solely by an API change.

## Verify externally

Check the GitHub Step 08 QA, then production activation workflow job and its `BACKUP_VERIFIED` / `BD_JOURNEY_ACTIVATED` markers. Publisher logs report accepted job IDs, not app-store public availability. Do not claim live release solely from successful code merge.
