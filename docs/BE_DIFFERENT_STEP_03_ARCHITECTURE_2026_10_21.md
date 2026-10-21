# BE DIFFERENT | Step 03 | Journey Architecture
Date: 2026-10-21
Repository: hsdarestani/aymantraining
Scope: Step 03 architecture / database / progression domain. This is not an already deployed feature.

## Models (additive to the original tables)

* JourneyGoal, JourneyPathway, JourneyPathwayGoal: reusable goals and curated combinations. Unknown combinations do not generate invented programs.
* JourneyPathwayVersion, JourneyLevelDefinition, JourneyChapter, JourneyChapterItem: versioned curriculum, ordered five levels and chapters, reusable links to legacy training plans and exercises.
* ChapterMediaVariant: coach/trainer media slots with minimum FREE or PRO tier; download endpoints are not yet protected by this model alone.
* JourneyAssessment: placement and chapter-final tests with coach-approved typed criteria and optional retest rules.
* JourneyEnrollment: a separate learner state for each pathway version. Self-assessment alone never confirms the entry level.
* JourneyActivityCompletion and JourneyTestAttempt: mandatory lessons, documented metric values, idempotency keys and coach-reviewed PASS/FAIL outcomes.
* JourneyChapterUnlock, JourneyChapterCompletion, JourneyLevelAward: persistent grants and a separately earned level history.

Existing User, Goal, Workout, ScoreSnapshot, Badge, TrainingPlan, PerformanceTest, media and consent tables remain in place. Score-derived legacy level does not automatically become an earned progression level.

## Security invariants

1. A high initial self-assessment never grants chapters. Only a coach assigned to the athlete or an administrator may confirm the placement.
2. A placement based on a test requires a previously passed and coach-approved placement attempt.
3. No unapproved criteria can grant a chapter or level. Attempts are PENDING until authorized review.
4. An assessment requires a confirmed active enrollment, a previously granted chapter unlock, and all mandatory content completed.
5. PASS can unlock only the next ordered chapter; it awards the next level only on crossing a level boundary. FAIL leaves current access intact and records missing or failed metrics.
6. Duplicate idempotency keys cannot create independent attempts or reuse a key for different measurements.
7. Media access requires both an earned chapter and sufficient subscription tier. This helper is not yet wired into the existing public media streaming routes: Step 8 must cover those endpoints.
8. Published versions should be frozen through all future write APIs and copied into a new draft for changes affecting existing learners.

## Migration verification

The dedicated Step 03 CI reproduces the previous main-branch Prisma schema on disposable PostgreSQL, seeds a legacy athlete/plan/workout/test/score/badge/consent, compares schema DDL, rejects destructive changes, pushes the additive schema without any accept-data-loss flag, and verifies historical records are intact.

A second isolated test creates an entirely fictional Football + Athletics + Muscle Building pathway and validates the placement gate, the failure/retest loop, progression to AWAKE, FREE/PRO media permissions, and unaltered legacy score.

No production database migration has been executed in this step. For any later deployment: take a tested backup, verify restore, inspect schema drift and run an explicit migration rollout. Sensitive menstrual-cycle records and consent are not part of Step 03 and require separate privacy/security work.

## Handoff

Step 4: onboarding goal selection and pending entry placement.
Step 5: versioned coach curriculum editor and publishing safeguards.
Step 6: API review workflow for tests, approved criteria, retests and coach decisions.
Step 7: actual athlete chapter navigation and earned progress APIs.
Step 8: strict media/plan/workout endpoints with both gates, including previously public media access.
Steps 9 to 15: personal coaching, score separation, women dashboard, optional cycle journal, streaks, animations, regression and release.

Acceptance means Prisma + TypeScript validation, old-data migration integrity, isolated lifecycle tests and successful build. A green commit is required before merge; production deployment is separate.
