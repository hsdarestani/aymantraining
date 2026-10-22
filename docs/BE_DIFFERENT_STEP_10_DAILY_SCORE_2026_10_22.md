# BE DIFFERENT – Step 10: distinct performance score, daily condition and plan

Implemented October 22, 2026 on the existing codebase without schema migration.

## Contract
- **BD SCORE** is the last recorded longitudinal score (0–100) with source date and data coverage. A snapshot with 0% coverage is *missing*, not an achieved zero. A snapshot older than 14 days is marked old; not interpreted as today's condition.
- **HEUTE** contains real check-in energy and soreness and same-day/previous-night measured sleep, if available; missing values remain null. Never synthesize a numerical readiness score or fill unknowns with zero.
- **TAGESPLAN** measures completed versus scheduled workouts for the athlete's local calendar day. Zero scheduled means **Kein Training eingetragen**, not an inferred recovery prescription or 100% completion.
- **LEVEL** comes only from an ACTIVE or FINISHED published Journey enrollment with confirmedLevel, never score tiers, inferred readiness or a purchase. No automatic demotion.
- **Privacy**: the mobile dashboard returns this profile only to the authenticated user; queries scope userId. The new summary does not include detailed PRO-only score pillars or other users' data.
- **Compatibility**: legacy scoreView preserves the old `level` response key for old binary clients, but the value is now only the coach-confirmed stage or null. New native/web screens do not derive a level from score thresholds. Existing scores, badges, workout history, Journey approvals and coaching records are unchanged.
- **Date correctness**: workouts use the user's timezone (DST aware); @db.Date rows use a date key rather than accidental UTC/local shifts. Sleep shows last night or today only.
- **Rollout**: GitHub changes and CI tests are not production deployment. Shared Esthetic VPS deployment must use the separate audited systemd path and safety checks, never the obsolete Docker workflow. Do not change database schema or host services.

## Acceptance
The dedicated isolated Step10 CI exercises missing data, 0%-coverage, stale score, DST and local midnight boundaries, partial/completed workouts and independent READY approval. Web/native typechecks and Next production build. Complete live acceptance additionally requires a safe deployment and App Store/Play Store build with physical-device checks.

## Legacy score and achievement paths
- Score calculation endpoint no longer returns an earned Level derived from the numeric result.
- Gamification Level and Level badges come from verified JourneyEnrollment/JourneyLevelAward records, not score thresholds. Existing historical badges are preserved without deleting athlete history.
- Digital Twin uses confirmed level or explicit unconfirmed state, and missing pillars stay missing instead of automatic red zero readings.
- The full quality workflow runs `scripts/test-step10-level-isolation.mjs` to reject future score-derived Level regressions.
