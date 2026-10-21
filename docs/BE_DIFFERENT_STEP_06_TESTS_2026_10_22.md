# BE DIFFERENT · Step 06 · Coach reviewed tests and progression

**Scope:** Athlete test submission, assigned-coach review, explicit placement, fail/retry feedback and atomic chapter/level progression. Based on Steps 3–5. This is implementation on a GitHub branch, **not a live production launch**.

## User flows

- Athlete: `/journey/tests` on web and `/journey-tests` in the Expo app. View only own published pathway enrolments. The unlocked chapter shows its assigned activities, mandatory progress and the published coach-approved test criteria. Locked chapters expose only level and title, never answers, item data or unearned media.
- After mandatory items are marked completed, the athlete sends numeric results with an idempotency key. New attempts remain **PENDING**. The UI shows submission state and prevents resubmission while review is outstanding.
- Coach/admin: `/admin/journey-tests` lists pending test submissions. A coach sees **only currently assigned athletes**; an admin sees the full queue. Reviewer provides actionable individual feedback before the approved criteria are used to compute PASS or FAIL. The client does **not** decide correctness.
- FAIL: shows deficient/missing metrics, the coach's written advice, optional coaching guidance and the earliest retest date derived from that assessment's rules. Previously earned chapters/levels remain intact. One day of recovery does not count as a failure.
- PASS: the assessment is recorded once with reviewer and timestamp, and the next chapter is granted atomically. Advancement across a level boundary awards the new Level; daily BD SCORE and payment tier cannot bypass this mechanism.
- Placement: a submitted and passed entry test **does not itself** change `confirmedLevel`. An authorized coach must confirm the starting level separately; `POST /api/journey/placement` supports passing `passedPlacementAttemptId` to require proof of a passed approved placement exam. Manual coach approval remains available, with an explicit action and existing assignment security.
- Notifications: a coach-reviewed assessment queues a personalized, preference-aware in-app/push notification with a private link to tests (no confidential results in push body). No notification is queued on a replayed review.

## New API surface

`GET /api/journey/tests` – athlete-owned published enrollments, earned chapters, own attempts, sanitized coach-approved criteria and retry details.

`POST /api/journey/tests/items` – mark own earned chapter item completed, idempotent, no level grant.

`POST /api/journey/tests/attempts` – submit a complete test; validates ownership, grade-approved rubric, all required content, latest retry interval and no pending test. Serializable transaction + idempotency keys prevent duplicated progression.

`GET /api/admin/journey-tests` – role- and coach-assignment-scoped pending review queue.

`POST /api/admin/journey-tests/[attemptId]/review` – authorized deterministic grading, individual feedback, atomic chapter and Level awards, preference-respecting follow-up notification.

`GET/POST /api/journey/placement` – previous endpoint extended with an optional passed placement attempt reference, independently checked in the domain service.

## Security and rollout

All Step 06 endpoints and screens are **off by default** and require `JOURNEY_TESTS_ENABLED=true` (server) and `EXPO_PUBLIC_JOURNEY_TESTS_ENABLED=true` (native). Both flags must remain off until the database, revised curriculum, role assignments, media security, backup and test criteria are production-ready. Server alone determines access and grade, independent of frontend flags.

No database schema alteration is required by Step 06, and no production database or stores have been changed. Legacy single-goal and old-performance-test APIs remain operational. Coach/admin permissions rely on existing user roles and coachAssignment checks. The athlete APIs never expose records from other users.

## Acceptance

Automated isolated PostgreSQL tests (`scripts/test-journey-step06.mjs`) exercise unauthorized coach views/review, pending test lock, FAIL with 48h retry, early test rejection, approved pass, separation of placement from self-rating, per-chapter mandatory prerequisites, exactly one next chapter, promotion only at level boundary, immutable historic attempts and ownership isolation. Existing Step 03 13-case tests run again. The dedicated workflow also checks TypeScript, web build, Expo mobile typecheck, and Playwright end-to-end athlete → coach → unlocked chapter.

A successful CI run and merge are code-level deliverables only. **Deployment requires a separate operational step** and Ashkan's sign-off on real assessment thresholds/feedback standards. The Chapter UI and expanded Progress Home in the later steps should use this service, not introduce parallel unlock rules.
