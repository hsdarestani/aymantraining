# BE DIFFERENT — Step 05: Coach curriculum editor
21 October 2026. Repository: hsdarestani/aymantraining.

## Delivered scope

A coach/admin-only builder under **/admin/journeys**, linked in both desktop and mobile admin navigation. It supports:
* Creating a **curated** goal combination, never auto-assembling unrelated training programs.
* All five ordered levels READY, AWAKE, DIFFERENT, BE DIFFERENT, TRULY DIFFERENT, each with descriptions and ordered chapters and durations.
* Chapters containing optional/mandatory guidance, legacy exercise references or existing training plans.
* Image media in FREE plus a written exercise explanation; 8–12 second PRO explanation clips, each linked to a coach or woman trainer media reference. Uploads use the existing secure-size-checked /api/media endpoint.
* Coach-entered placement and chapter-final test metrics and minimum/maximum thresholds, retry delay, German improvement tips and an explicit professional approval checkbox.
* Draft saving with a revision conflict guard, publishing a complete version, and cloning a published version into a new editable draft. Previously published versions remain immutable in these API endpoints.
* Matching exact goal combinations from waiting onboarding-intake requests after publication. Their status becomes PENDING_PLACEMENT; **no starting level or chapter is granted without placement approval**.
* Protecting chapter-linked image/video GET requests based on earned chapter and FREE/PRO entitlement in /api/media/[id] when editor flag is enabled. Existing media files not referenced by a Journey are unaffected. This protects existing Journey links; pre-upload cache exposure and the entire legacy exercise media distribution must be reviewed in Step 8.

## Rollout safety

The entire administrative builder/API is disabled by default and requires **JOURNEY_EDITOR_ENABLED=true**. This flag must remain **OFF** in live environments until a validated additive production schema migration is complete and a full storage/privacy audit has been conducted. When off, the page displays a polite unavailable message; no queries for the new tables are performed. Existing coaching and subscription experiences remain unchanged.

No real media files are created by the implementation itself: the coach must upload exercise photography and filmed 8–12 second explanation clips. The tests use fake asset metadata in **isolated PostgreSQL** only.

Before publishing, every level must have at least one chapter, every chapter at least one content item and an explicitly approved chapter-final test. Every exercise item needs a written FREE instruction, at least one FREE image, and at least one 8–12 second PRO video. Publisher validates media types, existing exercise/plan references, approved tests, and a frozen goal set.

Security assumptions: COACH and ADMIN roles share the curriculum catalog, but athlete-specific placement still checks direct coach assignment. Unrelated athlete progress files cannot be used as chapter media. Editing a linked *legacy* TrainingPlan/Exercise outside this builder is not versioned yet; preserve published exercise parameters before building mass legacy editors in later steps. Signed media and stricter storage behavior remain Step 8.

## REST workflow

* GET/POST /api/admin/journeys — list/create curated paths.
* GET/PUT /api/admin/journeys/[versionId] — load/edit **DRAFT** only; requires revision timestamp, rejects stale edits.
* POST /api/admin/journeys/[versionId]/publish — check curriculum, publish exactly once and register matching waiting intake requests.
* POST /api/admin/journeys/[id]/clone — clone latest published version to a new draft without changing earlier enrollments.
* /api/media and /api/media/[id] — coach-uploaded exercise media and chapter-aware access.

All mutating API routes require same-origin requests and a logged-in coach/admin role. The database operations are transactional. Client-side UI checks are not relied upon for security.

## Acceptance and migration

Dedicated GitHub Actions workflow: .github/workflows/step05-coach-curriculum.yml

It recreates main-branch schema in isolated Postgres, seeds representative existing records, checks DDL is additive, upgrades the schema, verifies historical records survive, runs coach authoring tests and the Step 03 progression suite, and builds the Next.js app.

The Step 05 tests verify denied athlete authoring, exact goal grouping, initial five levels, incomplete publication rejected, metric/video validation, FREE/PRO media references, persisted chapter graph, stale revision conflict, immutable publication, pending intake without unlocking and cloned draft version. **These are release gates, not a claim that the web or app has been deployed.**

## Handoff to Step 06

The next step builds athlete test submissions, coach-reviewed placement/promotion attempts, feedback/retest UI and notifications. The existing Step 03 service already holds the atomic state machine; Step 06 must surface it in API and UI without allowing the score or subscription status to bypass gates. Physical production migrations, real media links and public publishing depend on separate operational deployment work.
