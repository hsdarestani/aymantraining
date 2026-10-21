# BE DIFFERENT · Step 02 · Clickable Experience Prototype

**Date:** 2026-10-21  
**Related audit:** docs/BE_DIFFERENT_STEP_01_AUDIT_2026_10_21.md  
**Preview route after web deployment:** /prototype/step-02  
**Implementation:** app/prototype/step-02/page.tsx and prototype.css  
**QA:** tests/browser/step02-prototype.spec.mjs and .github/workflows/step02-prototype-qa.yml

## Purpose

A responsive, clickable product prototype that takes the five customer additions from 21 October 2026 into one demonstrable journey. It is deliberately separated from production onboarding, the real coaching database, native store clients and operational permissions. It does not perform real account, subscription, media, cycle or training-level writes.

A visitor can navigate between screens independently. **Browsing a screen never changes the active level**. The state-changing demo controls are explicitly labelled simulation.

## Supported clickable screens

| Screen | Purpose | Interaction |
|---|---|---|
| Goal combination | Multi-select sporting goals | Add/remove football, athletics, muscle-building, fat-loss, calisthenics and health goals; show curated sample combination; never fabricate unsupported recommendations |
| Self-assessment | Five levels, full German descriptions | Select READY, AWAKE, DIFFERENT, BE DIFFERENT, TRULY DIFFERENT; no unlock at selection |
| Placement approval | Self-reported vs confirmed entry | Simulate a passed placement test or coach approval; only this action confirms the demo start |
| Personal home | What do I do today? | Guided planned recovery, one next action, distinct example score/readiness/daily plan |
| Development path | Chapters, five levels and restrictions | Show 2 example chapters per level; only approved/earned chapters actionable |
| Exercise card | FREE vs PRO | Both tiers retain illustration placeholders and complete instructional text; PRO shows extra 8–12 second coach clip slot, not an invented recording |
| Chapter end test | Positive and negative result | Demo criteria: 20 pushups + 45 seconds plank; test blocked until chapter finished; failure gives advice and a simulated retest threshold; pass unlocks exactly one next chapter, or promotes when the final chapter of that level is passed |
| Coach reaction | Training → user feedback → coach response | Simulate a technique video and coach message, then surface a personalized cue in the exercise screen |
| Women dashboard | Optional, equivalent pathway | Select female during onboarding; opt in to women view or return to general dashboard; three alternate design accents; same unrestricted goals |
| Cycle privacy sample | Optional future module | Turn on/off, select day/energy/symptoms, choose normal/easy/recovery, coach sharing opt-in off by default, delete/deactivate |
| Milestones | Emotional coach moments | Open and dismiss small recovery, large day-30 and successful level-up scenes; quiet-motion and requested sound settings |
| Scope and assets | Contract clarity | Differentiate original base, changes and separately approved add-ons; preliminary ranges, coach/trainer media dependencies |

The sample route is exactly **Fußball + Athletik + Muskelaufbau**, as requested. It remains editable. The curriculum and tests are illustrative only and **must not** become published scientific/training criteria without coach sign-off.

## Design system

- Base palette: deep black and graphite, restrained DIFFERENT Volt highlights, generous whitespace and condensed sporty typography.
- Women's dashboard: same navigation and product identity, with optional coral, ice blue or Volt accents; no color stereotypes hardcoded by gender.
- No cartoon chatbot. The visible coach rail uses deliberately **labelled demonstration copy**; real footage and audio are **not fabricated**.
- Responsive desktop, tablet and compact mobile layout. Full page previews use one shared UI system.
- Keyboard-accessible button interactions, explicit pressed states, native selectable fields and responsive reduced-motion CSS. Celebrations can be skipped, and no actual sound is played without a supplied file.

## Acceptance checklist

1. Three goals can be selected at once. Changing to an unsupported combination does not invent an AI plan.
2. Select TRULY DIFFERENT in self-assessment, then go to the path **without** confirming placement: no usable chapter.
3. Confirm READY in the simulated test/coach step. The current chapter is visible; future levels are locked.
4. Exercise card in FREE: image placeholders and complete explanation. PRO: same content plus a labelled coach-video placeholder. Subscription switching does not modify earned level.
5. Mark first chapter complete, take demo test with initial 14 pushups and 30s plank: fail, see deficiencies and a retest rule, no unlock.
6. Enter 24 pushups and 50s plank, pass: second READY chapter unlocks **without prematurely promoting to AWAKE**.
7. Complete the second chapter, pass again: READY → AWAKE is earned and celebrated; the next AWAKE chapter is available.
8. Simulate technique-video submission and reply; return to exercise and confirm coach cue appears in context.
9. During onboarding choose female, then open women's dashboard. Switch back to general at any time; all goals remain selectable.
10. Turn on cycle module in demo, choose a different day, record optional symptoms/energy and choose an easier or recovery unit. Coach sharing is independent and off by default; deleting/disabling clears demo entries. No cycle data affects chapter unlocks.
11. Open each milestone, skip it, switch on reduced-motion and audio preference. Sound is not falsely played.
12. Verify mobile width ~390px, desktop width ~1440px, no horizontal overflow and controls remain legible.

**Automated browser acceptance:** tests/browser/step02-prototype.spec.mjs. Run with an isolated backend:
\`npx playwright test tests/browser/step02-prototype.spec.mjs\`.
Typecheck and build:
\`npm run check\` and \`npm run build\`.
The dedicated workflow is in the repository. Production site URL is not evidence of deployment until an actual deployment is confirmed.

## Three signature moments

**1. The app knows my plan.** The demo home prioritizes an assigned recovery day, not a claim derived from fabricated health data. Production needs actual plan and coach-rule sources.

**2. My coach is here.** User video → coach response → relevant cue next time the same technique is shown. The simulation has no real file upload or message.

**3. My progress matters.** Planned recovery produces a small affirmation, a 30-day streak produces a prominent coach-clip placeholder, and an earned READY→AWAKE transition produces a level animation. Small actions do not grant chapters.

## Existing concept vs changed scope

**Reusable original concept:** personal coach and communication, workout plans, exercise media, tests and performance results, score history, FREE/PRO flags, coach content management, recovery guidance and baseline awards.

**Explicit revisions:** move away from score-derived level unlock; introduce READY as first path level; one combined goal pathway; coach/test-confirmed initial level; ordered chapter and promotion gates; exercises available in FREE via pictures + text while PRO adds the 8–12 second explanation clip; no blanket PRO library bypass.

**Expansion requiring separate commercial review:** full pathway CMS/versioning, rule-based pass/fail and retests, expanded woman-first dashboard and new trainer media, custom filmed celebration assets, configurable milestone engine, context-propagated technique feedback.

**Optional separately approvable products:** sensitive cycle journal with separate consent and coach sharing; coach-spoken guided workouts. These are depicted to help estimate, **not production-enabled**.

## Preliminary development sizing (not a quote)

These estimates describe possible remaining production engineering work with the existing app as a base, assuming a small experienced development team and supplied approved content. They may overlap, are not additive fixed durations and exclude media production, legal sign-off and app-store review.

| Package | Ballpark |
|---|---|
| Versioned combined pathways, chapter/test model, access gates, migration and coach curriculum editor | 4–8 weeks |
| New guided home, coach technique feedback, FREE/PRO media access and women's MVP | 2–4 weeks |
| Achievement/streak engine, branded celebratory UI, regression and accessibility polish | 1–3 weeks |
| Optional private cycle journal, informed consent, data lifecycle and expert review | +2–4 weeks |
| Optional spoken-guided workouts | Separate technical/recording estimate after audio storyboard |

Actual development planning depends on the agreed feature boundary, existing infrastructure capacity, content volume and the verified mobile compatibility matrix.

## Media and expert inputs

**Coach:** Goal combinations and priority rules; program and chapter order; duration; assessment tests, thresholds and retest schedules; 3 exercise images or 3 extracted frames per exercise; labelled 8–12 second videos; German explanation/cue text; consented clips for high-five, applause, a short day-30 message and earned level-up.

**Woman trainer:** consistent videos/photos in the same exercise IDs and visual quality; coaching text and explicit rights/releases. Preferred accent styles to confirm.

**Product owner / legal reviewer:** Decide how tests qualify initial entry; how legacy score badges are migrated; what existing FREE/PRO personal coaching services remain; a separate explicit cycle-data consent/privacy assessment, retention/deletion policy and no automatic disclosure to coach.

## Production-safety guarantees for Step 02

- No production database changes, no migrations, no real subscription changes.
- No real video/audio uploaded, no claim that missing media is already filmed.
- No real tests/coach approvals or cycle records written.
- The route is deliberately labelled an illustrative prototype; screenshots are not claims of live feature release.
- Step 03 must preserve old users, workout histories, existing accepted plans and score records.

## Handoff to Step 03

After prototype review, design the additive relational model, backend gate services, upgrade mapping for old users, content status/versioning and comprehensive access tests. Product owner must approve scientific entry/promotion tests before turning them on.

**Completion rule:** Step 02 source, style, documentation and runnable browser tests are committed. An observed successful dedicated CI result is required before calling automated QA verified. A production deploy is a separate explicit action.
