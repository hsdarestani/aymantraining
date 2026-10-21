# BE DIFFERENT | Step 04 | Combined-goal onboarding and unconfirmed placement
Date: 2026-10-21. Repo: hsdarestani/aymantraining.

## Delivery
Web and Expo onboarding now offer a six-goal multiselect and explain five journey levels, with a separate self-assessment step AFTER personal details. For women, a women's dashboard is offered as an optional initial preference, never a restriction on available sports. WEB flags: NEXT_PUBLIC_JOURNEY_ONBOARDING_ENABLED. Native flag: EXPO_PUBLIC_JOURNEY_ONBOARDING_ENABLED. Server flag: JOURNEY_ONBOARDING_ENABLED. All must be enabled **only after** new schema migration is deployed safely.

API POST /api/onboarding/complete continues accepting the previous single-goal request unchanged. For new payloads it validates normalized goals, a five-level self-assessment, consent, age, and dashboard preference. The atomic transaction saves historic goal rows, personal baseline, consents, start test and the new JourneyIntake. If a curated PUBLISHED version with the **exact** goal combination exists, it also adds a PENDING JourneyEnrollment with no confirmedLevel and no unlock. Otherwise, the intake status is PENDING_PATHWAY and the selections wait until the coach publishes a matching curriculum. All operations succeed together or roll back together.

Authenticated GET /api/journey/onboarding exposes goals, levels, the pending intake, and the confirmed level when one exists. GET /api/journey/placement lists pending matches for authorized assigned coaches/admins. POST /api/journey/placement allows only assigned coaches/admins to authorize an entry level, using the Step 03 transactional approval ledger; it requires an actual published level with a chapter and rejects repeat approvals. It does not substitute for route-specific coach-approved placement test criteria. It never converts BE DIFFERENT SCORE into an earned level. On new clients duplicate calls with identical self-assessment and goal selection replay the recorded intake safely; conflicting changes return 409, leaving previously captured user data intact. Returning legacy clients continue with their single-goal path pending a future transition decision.

## Important user-visible distinctions
- Choosing TRULY DIFFERENT alone does not unlock TRULY DIFFERENT. Coach approval or a validated placement test is required.
- An optional numeric START TEST and long-term score are a baseline, not a placement test or an automatically earned level.
- A mismatch between selected goals and published pathways is never automatically replaced by several unrelated plans.
- Selecting female offers the option to opt into the women's start view; the six sport categories remain fully available. This preference is stored but the actual special dashboard remains Step 11.
- Paid PRO status is never used to confirm initial levels.
- The full interactive test authoring and grading UI/workflow are Step 6, and journey content UI is Step 7.

## Tests and rollout
Dedicated CI uses an isolated Postgres service, seeds the *previous* main Prisma schema with old user records, rejects destructive DDL, applies additive intake model and checks preservation. Browser/API acceptance checks:
1. Web supports three simultaneous goals, five descriptions, and optional women preference.
2. Unknown exact goal combination persists PENDING_PATHWAY without any chapter unlock.
3. Published combination persists PENDING_PLACEMENT and an unconfirmed Enrollment.
4. Same request is idempotent; conflicting requests are rejected.
5. Invalid goals or unavailable dashboard choice fail without user state changes.
6. Old one-goal clients still work.
7. Athlete requests cannot approve placement; authorized coach/admin confirmation opens only the first chapter and marks intake CONFIRMED.

CI also validates TypeScript, compiles web with flags on, runs mobile typecheck, and retains Playwright traces. Production flags default OFF. Do not turn them on until database backup, tested migration, release compatibility, and coach-approved criteria and curriculum are available. A green CI run is not a claim of a successful production deployment or signed app-store release.

## Hand-off to Step 5
Develop a coach-managed JourneyGoal / JourneyPathway / JourneyPathwayVersion editor, permit goal combinations, levels, chapters, approved media and criteria, and publish frozen versions. Associate waiting JourneyIntake requests with compatible published pathways, while preserving existing legacy histories.
