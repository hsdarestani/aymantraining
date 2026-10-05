# Phase completion acceptance

Scope: platform features in German and English, web/admin/native, wearable lifecycle, AI and human coach control. Owner-authored content, payment/email configuration and physical-device certification are excluded.

## Implementation

- Static English catalog with web/native language persistence, profile locale, localized platform copy, form labels, exercise English names and dates/numbers.
- Web AI and wearable entry points plus mobile navigation and lifecycle controls.
- Signed wearable gateway contract and a direct Terra adapter using documented widget, data and deauthentication endpoints. Terra raw-body signature verification; auth binding to expiring one-use attempts; ownership serialization; consent/entitlement checks; deduplicated data; disconnection and retryable remote revocation.
- AI policy configuration, contextual Responses API with store=false, explicit fallback, persisted coach handoff, assigned-roster access, claim/reply/resolve workflow, reply notifications and no autonomous plan writes.
- Scoped coach athlete lists, inbox/detail reads and athlete operations. Media message ownership validation. Capacity-safe and idempotent event registration. Plan-item validation before replacement.
- Privacy export includes AI messages/handoffs and wearable connection status.

## Verification state

Local schema/TypeScript checks for web and native pass. A production web build passed before the final adapter/formatting changes; it must be repeated on the exact final tree. Contract tests cover provider validation, dates/units, FREE/PRO filtering, signatures, coach hours and timezones, medical/plan-change escalation, AI output guards, and Terra payload normalization. Language tests verify identical nonempty catalogs and actual locale translation/preservation.

The PostgreSQL acceptance suite is designed for the isolated GitHub Actions service database. It asserts stored results and authorization for roster assignment, exercise creation, plan create/edit/clone/assignment, assigned test completion, reference norm creation/deletion, event joining/capacity/idempotency, push preference persistence, campaign roster isolation, profile locale persistence, AI successful provider/error/unsafe-output fallback, handoff claim/resolve/idempotency, all seven gateway provider cycles, consent/replay/signature/deduplication/disconnect behavior and privacy export.

**Until the exact final commit's CI results are recorded, this document is not a claim of full acceptance.** Live wearable authorization requires configured Terra keys and enabled provider integrations; simulator success does not certify a third-party production account. No physical-device or store release acceptance is claimed.

## Required runtime integration settings

Direct Terra: `TERRA_API_KEY`, `TERRA_DEV_ID`, `TERRA_SIGNING_SECRET`; webhook destination `/api/integrations/terra`. Configure only enabled providers and test with provider-owned accounts before claiming live provider certification.

Alternative compatible signed gateway: `WEARABLE_AGGREGATOR_URL`, `WEARABLE_AGGREGATOR_SECRET` (at least 32 characters). Requests are signed as HMAC-SHA256(timestamp + '.' + raw JSON). Gateway actions `/connect`, `/sync`, `/disconnect`; callbacks and data events use the documented implementation contract.

AI: `OPENAI_API_KEY`, optional `OPENAI_MODEL`; admin AI settings control availability, coach hours/timezone, tone and message limits. No provider key means clearly labeled rule fallback. `OPENAI_RESPONSES_URL` exists solely for loopback CI simulation or the official OpenAI endpoint.
