# BE DIFFERENT — Step 01 / Requirements & Code Audit
**Date:** 2026-10-21  
**Repository:** hsdarestani/aymantraining  
**Baseline:** main at 19da8b209961c834174357812e2eeda134f37386 (2026-10-19)  
**Inputs:** BE_DIFFERENT_Konzept Ende.pdf v1.1 (2026-09-24, 17 pages) and five written customer additions (2026-10-21): guided coaching experience; combinable goals and test-gated progression; chapter-based FREE/PRO distinction; women's dashboard and optional cycle module; celebrations and milestone rules.  
**Purpose:** A read-only baseline and an actionable traceability plan. This document does not claim deployment, live database validation or physical-device acceptance.

## 1. Executive result

**Decision: evolve the existing product, do not rebuild it.** Existing entities and working features include athlete/coaching roles, goals, plan templates and assignments, exercises/media, logged workouts, performance tests and results, score history and coach rules, messaging and video feedback, subscription entitlements, wearable intake, daily checks, badges and challenges. The new customer direction requires a **new progression domain** and **two independent authorization gates** (subscription + earned chapter access). It is not a cosmetic redesign.

The next phase should implement this as an additive, migration-safe change. Old athlete data, score history, assignments, workouts, badges and consent records must remain intact.

## 2. Evidence and inspected areas

- Prisma schema: prisma/schema.prisma; Next.js app/api/**; coach panel app/admin/**; web athlete app/**; React Native / Expo mobile/app/**; lib/score.ts; lib/scoring.ts; lib/gamification.ts; lib/entitlements.ts; lib/recommendations.ts; and existing QA/architecture documents.
- The original PDF (pp. 1–6, 8–11, 13–16) expressly describes a human-coached fitness/lifestyle product, onboarding goals, FREE/PRO differentiation, score-driven levels, exercise media, coach/test builders, sleep/nutrition/wearable features and future cycle/gamification ideas.
- Existing tests/workflows: tests/browser/platform.spec.mjs, scripts/test-feature-contracts.mjs, .github/workflows/quality.yml, native-check.yml and android-cold-start-crash-smoke.yml.
- CI state of baseline commit: [Product Quality Gate #39274060360](https://github.com/hsdarestani/aymantraining/actions/runs/39274060360) **failed at visible-copy policy**, finding a long dash at mobile/app/(tabs)/index.tsx:86 and "E-Mail" at mobile/app/index.tsx:8; following test stages were skipped. [Publisher release #39274060411](https://github.com/hsdarestani/aymantraining/actions/runs/39274060411) succeeded but is NOT evidence that tests passed or a store deployment went live. An earlier [Android cold-start smoke #39273275188](https://github.com/hsdarestani/aymantraining/actions/runs/39273275188) stopped on a shell syntax error before crash verification. [Native App Check #39274013181](https://github.com/hsdarestani/aymantraining/actions/runs/39274013181) succeeded on the preceding commit, not the exact baseline.

**Inspection scope and limits:** repository source/schema and CI logs were inspected. Production DB rows, deployed web/admin interactions, login-dependent endpoints, real subscriptions, iOS and Android devices, and actual coach-uploaded content were **not** independently verified. A schema is not proof that production data or migrations are healthy.

## 3. Current baseline (reusable)

| Area | Code evidence | Baseline finding |
|---|---|---|
| User/role/privacy | prisma/schema.prisma: User, ConsentRecord, CoachAssignment; lib/coach-access.ts | Existing roles, coach roster isolation and general health/media consent. |
| Onboarding | mobile/app/onboarding.tsx; app/onboarding/page.tsx; app/api/onboarding/complete/route.ts | One selected goal, three experience labels and optional initial physical measures; no confirmed five-level pathway. |
| Exercise/program content | TrainingPlan, TrainingPlanItem, Exercise, PlanAssignment; app/admin/plans and exercises | Seven-day plan templates, exercise media upload, plan editor, manual assignment and workout history. |
| Tests | PerformanceTest, TestResult; app/admin/tests; mobile/app/tests.tsx; app/api/performance-tests/** | Test creation/results and score recomputation; no persistent PASS/FAIL assessment or chapter-transition ledger. |
| Score/daily | lib/scoring.ts; lib/score.ts; lib/score-view.ts; app/api/mobile/dashboard/route.ts | Recalculable, multi-pillar score with completeness and recommendations, but level still derived from score. |
| Coaching | app/admin/customers, inbox, video-feedback; mobile/app/(tabs)/coach.tsx | Messages, technique-video uploads, feedback notes and coach planning; feedback not tied to a future matching training step. |
| Subscription | lib/entitlements.ts; app/api/exercises/**; app/api/media/[id]/route.ts | Server flags and tier checks exist, but entitlement is not combined with earned chapter-level access. |
| Streak/badges | lib/gamification.ts; Badge; ChallengeEntry | Basic awards and daily streak from workouts/check-ins/app opens, without a coach-configurable policy. |
| Women's health | AthleteContext.cycleTrackingEnabled / cycleStartDate / cycleLengthDays; lib/recommendations.ts | A limited cycle context exists; not a separate optional, consented and private cycle-journal product. |
| Native | mobile/app/**, Expo | Existing native experiences and technical integrations provide a reusable base. |

## 4. Complete new-requirement traceability

Status definitions: **EXISTING** = demonstrated source capability; **PARTIAL** = some reusable implementation exists; **MISSING** = no complete matching model/flow found; **CHANGE** = explicit override of the 2026-09-24 concept; **OPTIONAL** = separately approvable module.

| ID | Requirement / customer acceptance intent | Current | Delivery step(s) |
|---|---|---|---|
| R01 | Select multiple goals simultaneously; resolve to one curated, coherent football + athletics + muscle-building path, not parallel unrelated programs | CHANGE / PARTIAL (Goal supports multiple records; onboarding sends one) | 3–5 |
| R02 | Five described self-assessment levels scoped to selected path | MISSING | 2, 4 |
| R03 | Initial level unverified until test or coach approval; do not unlock high levels by self-selection | MISSING | 4, 6–7 |
| R04 | Level and ordered chapter hierarchy with locked previews, next action and progress per chapter | MISSING | 3, 7 |
| R05 | Chapter-end assessment with route-specific criteria, PASS/FAIL, retest timing, actionable failure advice and coach override | PARTIAL (generic tests) | 5–7 |
| R06 | Level never automatically decreases because daily score changes; READY replaces NORMAL | CHANGE | 7, 10 |
| R07 | Independent subscription and chapter gate for EVERY protected endpoint/media; PRO cannot bypass tests | CHANGE / MISSING | 7–8 |
| R08 | FREE exercise images + written guidance; PRO adds 8–12 second coach video, within the same earned chapters | CHANGE / PARTIAL | 5, 8 |
| R09 | Coach can edit goal combinations, path mapping, chapters, timing, conditions, repeats, images/videos and user progress | PARTIAL | 5–7 |
| R10 | Context-grounded home: today's condition, actual next scheduled action, rest, pending missing inputs; no invented data | PARTIAL | 9–10 |
| R11 | Coach persona at relevant moments: instructions, approved plan change, technique feedback visible in next applicable workout | PARTIAL | 9 |
| R12 | Distinguish score as longitudinal profile vs today's condition vs daily plan completion; show missing data and explanations | CHANGE / PARTIAL | 10 |
| R13 | Signature practice and skill-ladder paths with criteria and human coach feedback | PARTIAL | 5–7, 9 |
| R14 | Female dashboard offered (not mandated) on female onboarding selection; switchable later, all sports accessible | MISSING | 4, 11 |
| R15 | Women's curated combined paths, consistent brand UI, optional selectable visual variants, woman trainer assets | PARTIAL infrastructure, missing female UX/media assignment | 5, 11 |
| R16 | Cycle calendar, actual symptoms/energy/mood, choice of easier workout/rest, reminders, estimates not contraception | OPTIONAL / PARTIAL context | 12 |
| R17 | Cycle data: separate explicit consent, data inventory, private by default, explicit coach sharing, delete & disable; no cycle-based progression penalty | MISSING for requested privacy model | 12 |
| R18 | Small, medium and full-screen coach-led milestone celebrations and 30-day/level-up demos | PARTIAL badges / MISSING animation engine | 13–14 |
| R19 | One eligible action per local day, scheduled recovery counts, historical workout sync uses actual date, events/idempotency, badges persist | PARTIAL and conflicting current streak rules | 13 |
| R20 | Coach-editable achievements, criteria, text, visual intensity, deduplication and batching | MISSING | 13–14 |
| R21 | Celebration does not grant chapter/level; reduced motion, skippable, mute, never interrupt workout/timer, share only explicitly and without sensitive fields | MISSING | 13–14 |
| R22 | Guided spoken workout using coach recordings: separate estimate and explicit approval, not assumed shipped | OPTIONAL | 2, 9 or later |
| R23 | Clickable prototypes: combined training pass/fail; day-to-coach loop; women's seven screens; recovery, 30 days, level-up animations; mark original scope vs extra | NOT YET VERIFIED | 2 |
| R24 | Complete regression, permissions, data migration, API/app and store-device checks before release | PARTIAL; current web CI red | every step, 15 |

## 5. High-priority risks

**P0 – Exercise videos may bypass FREE/PRO limits.** app/api/media/[id]/route.ts classifies EXERCISE_IMAGE and EXERCISE_VIDEO as public and serves without athlete or tier validation; app/api/workouts/[id]/route.ts embeds exercise.videoUrl in workout data, regardless of tier. Even if /api/exercises and /api/exercises/[id] gate library entries, a direct exercise video URL lacks the required PRO gate. Introduce an authorized media access design with short-lived/private delivery and chapter-aware checks before promoting the new paywall.

**P0 – The existing FREE test cap conflicts with mandatory promotion tests.** app/api/performance-tests/route.ts disallows additional user-created performance tests after the first completed FREE test. Coach-assigned tests have a different route, but an agreed model must explicitly guarantee mandatory chapter tests to FREE and PRO regardless of optional performance-testing premium privileges. Do not accidentally paywall the ability to advance.

**P0 – No stable chapter progression or outcome ledger.** The existing PerformanceTest.definition/results are generic JSON/metrics, while completing a test (app/api/performance-tests/[id]/complete/route.ts) merely stores results, recalculates score and gamification. There is no evaluated outcome, approved start-level, chapter unlock, retry status or immutable achievement transition.

**P1 – Score and earned progress are conflated.** lib/score.ts, lib/scoring.ts, lib/score-view.ts and lib/gamification.ts map daily score to NORMAL/AWAKE/DIFFERENT/BE DIFFERENT/TRULY DIFFERENT; level badges are also score-derived. New awarded levels require independent immutable progress state.

**P1 – Inconsistent streak semantics.** lib/gamification.ts treats app_open as an active day; a recovery day counts only indirectly if recorded as a daily check; no dedicated planned-recovery completion exists. Day attribution uses basic date serialization, and badge events are not linked to personalized celebration delivery.

**P1 – Cycle privacy and autonomy.** AthleteContext currently has limited cycle fields and cycle-based recommendations. The general ConsentRecord API only accepts health_data/privacy/terms/media_processing; there is no scoped cycle consent, explicit coach-share toggle or independent cycle-entry deletion. Do not expose private entries to coach views or progression logic without a dedicated model, user authorization and privacy review.

**P1 – User journeys and layouts.** Native onboarding uses one goal and three experience options. Native training currently has independent plan/library discovery links instead of chapter state. Native dashboard can emphasize a large score and standalone modules rather than an unambiguous verified next step.

**P1 – Latest quality gate unverified.** Fix the two text-policy violations (or confirm a deliberate updated language policy), then obtain green tests on the implementation commit. Do not mistake a successful release-trigger workflow for full quality acceptance.

**P2 – Coach content governance and safety.** Define approved/unpublished/archived path versions and test standards, prevent edits from silently changing in-progress chapters, and validate coach material before public use. Women trainer videos need consented usage rights, speaker linkage and consistent media capture.

## 6. Scope change ledger relative to original 2026-09-24 PDF

- **Originally described, now made more concrete:** human coach identity, meaningful daily recommendation, coach-backed plans, progress tests, user/coach media, 3 exercise images, customizable plan/test builders, score explanation, general FREE/PRO access, gamification/streaks and an optional cycle direction.
- **Explicit logic/contract changes:** score-derived 0–39 NORMAL leveling becomes earned READY-through-TRULY DIFFERENT; multiple goals resolve to a curated pathway; tests become compulsory chapter unlock gates; PRO does NOT receive the entire future library; existing FREE coach-video entitlement becomes PRO-only 8–12 second exercise video (images/text available in FREE).
- **Material expansion requiring scoped estimate/approval:** coach-authored complete curriculum/chapter/test CMS and grading, women's opt-in dashboard/personal trainer content, separately consented cycle journal and rest alternatives, coach cutout video celebrations and configuration engine, new signature recorded guided workout.
- **Already mentioned but not necessarily included in first release:** the original PDF labels Digital Twin, Fuel Score and Challenges/Community as phase-two items; it also mentions cycle tracking under further ideas. Mere mention in concept is not proof that the complete newly specified modules were contracted. Commercial scope needs the governing agreement, not just the product brief.

## 7. Migration-safe design constraints for Step 03

1. Add a versioned content hierarchy: GoalCatalog, GoalCombination/Pathway, PathwayVersion, LevelDefinition, Chapter, ChapterExercise/Section, TestDefinition, PassCriterion and MediaVariant/Presenter.
2. Add a separate learner state: PathEnrollment, InitialAssessment/CoachApproval, ChapterAttempt, TestAttempt, AssessmentDecision (pass/fail/pending), UnlockEvent, AchievementEvent and idempotency key. Keep timestamps and audit actor.
3. Add one central server authorization policy for chapters + subscription + media variant; enforce on listing, detail, workout and media/download. Do not rely on hiding UI alone.
4. Preserve User/Goal/TrainingPlan/PlanAssignment/Workout/PerformanceTest/ScoreSnapshot/Badge IDs and historical records. Create links/compatibility adapters; **do not auto-award a confirmed level from the old numeric score**. Set a non-disruptive transition policy for existing athletes with coach approval.
5. Maintain explicit source timestamps and user timezones for daily streak calculations; support late wearable/workout sync and idempotent replays.
6. Segregate sensitive cycle journal and consent/sharing permissions; exclude it from generic coach endpoints by default. Decide retention/export/delete security in a dedicated threat/privacy review.
7. Version coach-authored curricula; live edits should not invalidate already approved user history. Define moderation/publishing behavior and reversal/audit policy.

## 8. Step 02 clickable prototype acceptance

The clickable core demo must include: goals Football + Athleticism + Muscle Building; five levels with descriptions; user self-ranking then test/coach confirmation; active chapter; preview of locked next chapter; test pass with transition; test fail with improvement guidance and retest; FREE same image/text as PRO but only PRO coach video; dashboard showing evidence-based next action and coach response to a technique video; alternate women's opt-in start, woman-presenter card and combined path; optional private cycle UX; three distinct event moments (recovery check, 30-day coach video, READY -> AWAKE post-pass), plus reduced-motion/silent/skip states. Every extra-cost concept must be labeled.

## 9. Client approvals and external inputs

- Customer-defined goal combinations, authored plan content and chapter ordering (demo content may be clearly marked example only).
- Exact initial placement tests, pass/fail rules, progression/retest criteria and manual-approval rules: **must be agreed before production promotion logic is enabled**.
- FREE/PRO commercial interpretation of existing personal-coach services beyond exercise video; duration and media rights for male/female presenters.
- Separate acceptance of women's MVP vs cycle module and signature spoken workout.
- Written privacy/security/legal review for sensitive data and sharing.
- Approval of logo/brand palette, women's visual direction and celebration storyboards; source video, cutout/high-five clips, photos and audio supplied/licensed by coaches.
- Policy for existing active users and provisional legacy levels, plus any archived plans.

## 10. Step 01 completion and Step 02 handoff

**Complete as a source-level requirements audit:** repository, schema, backend, coach panel structure, web/native journey, core tests, source concept and five additions cross-checked; requirements IDs, evidence, risks, old/new scope, migration constraints and demonstration acceptance written here.

**Not claimed complete:** production database inspection, deployed signed-app testing, real coach content review, legal certification, prototype signoff, implementation or release of new behavior.

**Next:** Step 02 interactive prototype and stakeholder scope/effort signoff, without altering live progression or historical user data. After signoff, execute additive architecture/schema migration in Step 03.