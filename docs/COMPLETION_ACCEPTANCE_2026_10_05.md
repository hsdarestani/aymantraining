# Phase completion acceptance

Scope: platform features in German and English, web/admin/native, wearable lifecycle, AI and human coach control. Owner-authored content, payment/email configuration and physical-device certification are excluded.

## Implementation

- Static English catalog with web/native language persistence, profile locale, localized platform copy, form labels, exercise English names and dates/numbers.
- Web AI and wearable entry points plus mobile navigation and lifecycle controls.
- Signed wearable gateway contract and a direct Terra adapter using documented widget, data and deauthentication endpoints. Terra raw-body signature verification; auth binding to expiring one-use attempts; ownership serialization; consent/entitlement checks; deduplicated data; disconnection and retryable remote revocation.
- AI policy configuration, contextual Responses API with store=false, explicit fallback, persisted coach handoff, assigned-roster access, claim/reply/resolve workflow, reply notifications and no autonomous plan writes.
- Scoped coach athlete lists, inbox/detail reads and athlete operations. Media message ownership validation. Capacity-safe and idempotent event registration. Plan-item validation before replacement.
- Privacy export includes AI messages/handoffs and wearable connection status.

## Verified technical acceptance — 5 October 2026

- [Product Quality Gate](https://github.com/hsdarestani/aymantraining/actions/runs/37284746534) passed on `376dee21ef8c289a18929047bf93b08ab73197c2`: 303 persisted API operation assertions, three browser acceptance tests, contract regressions, schema/type checks, dependency audit and production build.
- Browser tests exercise language persistence and preservation of entered text; bilingual exercise creation; saved plan sets, real pointer reorder, cross-day movement and progression persistence; and athlete AI handoff followed by admin claim, reply and resolution.
- [Native App Check](https://github.com/hsdarestani/aymantraining/actions/runs/37283519617) passed: actual Android debug build, WearOS debug build, native TypeScript and actual iOS simulator app plus embedded Watch/widget compilation. The mobile tree is identical between that run's commit `fda84911c498e299153e11b0674719691c6d1aff` and the final web commit: `86b9659dd027ce89650addc653a138c75a830a33`.
- The identical web/native English catalogs contain 1,524 entries. Catalog regression checks cover known system copy, dynamic reports and preservation of user text.

| Feature area | Acceptance evidence |
|---|---|
| Admin exercises and plans | Create/edit/clone/assign, English names, stored sets, progression, pointer reorder and day movement |
| Coach access | Assigned roster isolation for athletes, inbox, media and plans |
| Athlete operations | Profile locale, assigned tests, events, challenge eligibility, push preferences and companion session |
| Concurrent operations | Event capacity, AI daily limits and one-use companion pairing |
| AI behavior | Coach availability/timezone, context, medical and plan-change escalation, output guards, provider errors and explicit fallback |
| Human control | Persisted handoff, scoped queue, claim/reply/resolve, notifications and no autonomous plan assignment |
| Wearable lifecycle | All seven gateway provider connect/sync/disconnect cycles, consent, entitlement, signed callbacks, replay prevention, deduplication and revocation retries |
| Terra integration | Adapter request contracts, signed auth/data callbacks and payload normalization using isolated provider simulation |
| Privacy and deployment | Export/delete relations, pairing purge and seed preservation of administrator edits |

These results establish technical acceptance for the tested platform workflows. Live third-party wearable authorization still requires configured Terra/gateway keys and enabled provider accounts; simulated provider acceptance does not certify those external production accounts. Physical-device and store-release acceptance remain outside this scope. Production rollout is tracked separately by the deployment workflow.

## Required runtime integration settings

Direct Terra: `TERRA_API_KEY`, `TERRA_DEV_ID`, `TERRA_SIGNING_SECRET`; webhook destination `/api/integrations/terra`. Configure only enabled providers and test with provider-owned accounts before claiming live provider certification.

Alternative compatible signed gateway: `WEARABLE_AGGREGATOR_URL`, `WEARABLE_AGGREGATOR_SECRET` (at least 32 characters). Requests are signed as HMAC-SHA256(timestamp + '.' + raw JSON). Gateway actions `/connect`, `/sync`, `/disconnect`; callbacks and data events use the documented implementation contract.

AI: `OPENAI_API_KEY`, optional `OPENAI_MODEL`; admin AI settings control availability, coach hours/timezone, tone and message limits. No provider key means clearly labeled rule fallback. `OPENAI_RESPONSES_URL` exists solely for loopback CI simulation or the official OpenAI endpoint.
