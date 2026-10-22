# BE DIFFERENT · Step 07 · Personal Journey Reader and Legacy Opt-In
Date: 22 October 2026. Repo: hsdarestani/aymantraining.

## Delivered

- Read-only, access-controlled `GET /api/journey/overview` returns **only the signed-in athlete's** published pathway enrollments, five-level descriptions as available, earned Level awards, chapter titles and locked/open status, confirmed versus self-estimated Level, and counted mandatory activities only for opened chapters. The previous athletic score does not confer Level access.
- Authenticated `GET /api/journey/chapters/[chapterId]?enrollmentId=...` verifies **both ownership and a persistent chapter grant**, confirms the chapter belongs to that exact version, and then returns the full description, items, referenced exercises/plans and media eligibility. Locked previews never include private exercises, instructions, test data, storage paths, media IDs or progress counts.
- FREE sees training images and written instructions; PRO gets those plus short, authorized explanation videos. The endpoint supplies a media URL only when the subscription and earned chapter checks pass, and only when the protected media-serving feature is enabled. Inaccessible media is represented by a harmless locked-state descriptor without a media URL or asset ID. The existing chapter-protected `/api/media/[id]` endpoint must also check authorization on streaming.
- Athlete website `/journey` and Expo `/journey`: athletic five-level chapter map, earned status, chapter content viewer and relevant training media. The Step 06 exam/completion routes are reused rather than creating competing unlock rules. Dashboard shortcuts are gated by feature switches.
- Existing athletes are invited to **voluntarily** join a curated combined-goal pathway using their chosen goals and a five-level self-assessment. `POST /api/journey/legacy-transition` requires an explicit acknowledgement. It writes a separate `JourneyIntake` and optional `PENDING` `JourneyEnrollment`; no legacy PlanAssignment, workout, Goal, ScoreSnapshot, badge or consent is modified or replaced. Missing exact goal combination is recorded as `PENDING_PATHWAY`, never supplemented with invented programs.
- Requests cannot trigger an automatic earned Level, automatic chapter grant or migration of historical score into Level awards. Existing enrolled athletes cannot be re-enrolled through this method.

## Security and compatibility

- Flag `JOURNEY_OVERVIEW_ENABLED` gates **all new server endpoints and web page** (default off), `EXPO_PUBLIC_JOURNEY_OVERVIEW_ENABLED` gates the native navigation (default off).
- The full experience also depends on the previous Steps 3–6 production migration and release preparations, the coach-published pathway and approved assessment policy, `JOURNEY_TESTS_ENABLED` for test submissions and `JOURNEY_EDITOR_ENABLED` for protected media download. No live database migration, production flag activation, or iOS/Android App Store publishing happens in Step 07.
- Locked chapter intros contain only a coach-authored chapter title, not its instructions or media. Existing exercise media and plan objects remain editable through legacy UIs; a later content/version immutability hardening pass remains necessary.
- Existing client versions and routes continue to work unchanged. Users do not lose old progress if they opt in. Existing progress is retained, **not automatically converted**.

## Acceptance

- Isolated PostgreSQL domain suite `scripts/test-journey-step07.mjs`: ownership, no locked-data leakage, FREE vs PRO media, separate legacy Score, explicit legacy transition, unchanged legacy records, duplicate request denial and unknown goal match handling.
- Step 03 progression regression suite and web/Expo typechecks/production build.
- Browser suite `tests/browser/step07-journey.spec.mjs`: logged-in athlete sees only earned chapter details, unauthorized ID read denied, opt-in workflow captures goals with no earned chapter awards.
- Dedicated GitHub Actions `.github/workflows/step07-journey.yml`, all against disposable data.

## Handoff to Step 08

End-to-end media storage/cache entitlement enforcement, immutable published exercise references and robust workout-plan API authorization, including any old endpoints still distributing media, are Step 08 priorities. Production rollout requires tested DB backup/restore, technical privacy review, valid coach-authored curriculum and staged flag activation.
