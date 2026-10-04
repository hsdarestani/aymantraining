# BE DIFFERENT · Production Readiness

## Automated gates

A release is acceptable only when these are green:

- Product Quality Gate: locked dependencies, high severity audit, Prisma, TypeScript, PostgreSQL, production build, E2E
- Native App Check: native dependency install, TypeScript, Expo prebuild, Store Billing modules, Firebase modules, release script validation
- Production deploy: DB migration/seed, Docker build, health/readiness, public Cloudflare check
- Publisher validation: Django tests and production deployment

## Production architecture

- Backend: BE DIFFERENT VPS / PostgreSQL
- Media: persistent local VPS volume
- Backup: daily PostgreSQL dump + media archive, 14 day retention
- Email: Strato SMTP
- Android payment: Google Play Billing
- iOS payment: Apple StoreKit
- Subscription verification: Google Android Publisher API + Apple App Store Server API
- Push: Firebase Admin -> FCM; iOS delivery uses APNs through Firebase
- Build/upload: A+ Publisher cloud Linux and macOS agents

No RevenueCat, Expo Push, R2 or Resend is required.

## Existing app repository deployment secrets

Already used:
- `HOST`
- `PASS`

Needed for fully connected production:

### Firebase server push
- `FIREBASE_SERVICE_ACCOUNT_B64`

### Apple subscription verification
Create an App Store Connect In-App Purchase API key:
- `APPLE_IAP_ISSUER_ID`
- `APPLE_IAP_KEY_ID`
- `APPLE_IAP_PRIVATE_KEY_B64`

### Google subscription verification
- `GOOGLE_PLAY_SERVICE_ACCOUNT_B64`
- `GOOGLE_RTDN_WEBHOOK_SECRET`

### Strato SMTP
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`

Optional:
- `SENTRY_DSN`
- `POSTHOG_KEY`
- Cloudflare Origin TLS secrets

## Publisher repository secrets

Android:
- `BEDIFFERENT_FIREBASE_ANDROID_GOOGLE_SERVICES_B64`
- `BEDIFFERENT_ANDROID_KEYSTORE_B64`
- `BEDIFFERENT_ANDROID_KEYSTORE_PASSWORD`
- `BEDIFFERENT_ANDROID_KEY_ALIAS`
- `BEDIFFERENT_ANDROID_KEY_PASSWORD`

iOS:
- `BEDIFFERENT_FIREBASE_IOS_GOOGLE_SERVICE_INFO_B64`
- `BEDIFFERENT_APPLE_TEAM_ID`
- `BEDIFFERENT_ASC_KEY_ID`
- `BEDIFFERENT_ASC_ISSUER_ID`
- `BEDIFFERENT_ASC_PRIVATE_KEY_B64`

Release trigger:
- app repo: `PUBLISHER_URL`, `PUBLISHER_AUTOMATION_TOKEN`
- Publisher production: same `PUBLISHER_AUTOMATION_TOKEN`

## Store configuration

iOS:
- bundle ID `com.smarbiz.bedifferent`
- products `bd_pro_monthly`, `bd_pro_yearly`
- 7 day introductory trial
- App Store Server Notifications V2 URL:
  `https://bedifferent.smarbiz.sbs/api/webhooks/apple`

Android:
- package `com.smarbiz.bedifferent`
- products `bd_pro_monthly`, `bd_pro_yearly`
- 7 day offer
- Real-time developer notifications through Google Pub/Sub push:
  `https://bedifferent.smarbiz.sbs/api/webhooks/google-play?token=<GOOGLE_RTDN_WEBHOOK_SECRET>`

## Content still supplied by the coach/owner

The platform and admin tools support the exercise schema, but real launch media must still be supplied:
- exercise images
- short coach videos
- final legal company data/review


Validation marker: direct Apple Google Firebase SMTP architecture with regenerated lockfiles.
