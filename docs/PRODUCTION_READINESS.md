# BE DIFFERENT · Production Readiness

This document contains names and setup requirements only. Never commit real secret values.

Validation marker: final native lockfile state.

## Automated gates

A release is acceptable only when all are green:

- Product Quality Gate
  - locked dependency install
  - production dependency audit at high severity
  - Prisma validation
  - TypeScript
  - PostgreSQL integration database
  - production Next.js build
  - end to end product smoke test
- Native App Check
  - locked dependency install
  - TypeScript
  - Expo public config validation
  - clean Android Expo prebuild
- Production deploy
  - database migration and seed
  - Docker build
  - origin health check
  - Cloudflare public readiness check

## Existing GitHub deployment secrets

- `HOST`
- `PASS`

## Server integrations

Required for a fully connected production launch:

### RevenueCat

- `REVENUECAT_WEBHOOK_SECRET`
- `REVENUECAT_IOS_PUBLIC_API_KEY`
- `REVENUECAT_ANDROID_PUBLIC_API_KEY`
- `REVENUECAT_PRO_ENTITLEMENT` = `pro`
- `REVENUECAT_ELITE_ENTITLEMENT` = `elite` only when ELITE is activated

RevenueCat webhook URL:
`https://bedifferent.smarbiz.sbs/api/webhooks/revenuecat`

### Private media storage

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

The application has a local-storage fallback, but R2 is required for durable multi-instance production media.

### Push

Recommended Expo push path:

- `EXPO_PUSH_ACCESS_TOKEN`

Optional direct Firebase path:

- `FIREBASE_SERVICE_ACCOUNT_B64`

### Email

- `RESEND_API_KEY`
- `EMAIL_FROM`

### Observability

Recommended before public launch:

- `SENTRY_DSN`
- `POSTHOG_KEY`

## Native build-time values

These belong in the Publisher app build-config environment:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

They are SDK identifiers/keys embedded into the mobile binary, not backend secrets.

## One-time external setup

These cannot be completed from source code alone:

- Apple Developer / App Store Connect app record
- Google Play Console app record
- store legal/tax/merchant agreements
- App Store subscription products and trial
- Play subscription products and trial
- RevenueCat project, apps, products, offering and entitlement
- Expo project for push project ID
- Apple HealthKit capability
- Apple Push Notifications capability
- Android release upload keystore
- iOS signing certificate/profile or automatic-signing setup on the macOS Publisher agent
- legal review of Privacy Policy, Terms, Impressum and health-data DPIA/processor agreements
- real BE DIFFERENT exercise images and short Ayman exercise videos

## Store IDs

- Android: `com.smarbiz.bedifferent`
- iOS: `com.smarbiz.bedifferent`

## Store products

- `bd_pro_monthly`
- `bd_pro_yearly`

Both should grant RevenueCat entitlement `pro`. The 7 day trial must be configured in the stores.

## Publisher

See `docs/PUBLISHER_RELEASE.md` for the app record and build configuration.


## Origin TLS / Cloudflare Full Strict

Recommended before public release:

- `CLOUDFLARE_ORIGIN_CERT_B64`
- `CLOUDFLARE_ORIGIN_KEY_B64`

Create a Cloudflare Origin Certificate for `bedifferent.smarbiz.sbs`, base64-encode the certificate and private key separately, save them as GitHub Secrets, deploy once, then set Cloudflare SSL/TLS mode to Full (strict).

## Publisher build-agent signing secrets

These do not belong in GitHub Secrets. Keep them on the corresponding build agent environment.

Android Linux agent:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

iOS macOS agent:

- `APPLE_TEAM_ID`
- optional `IOS_SCHEME`
- optional unattended provisioning: `ASC_KEY_PATH`, `ASC_KEY_ID`, `ASC_ISSUER_ID`


## Remote Publisher build trigger

After the BE DIFFERENT app record exists in Publisher, set these GitHub Secrets in this repository:

- `PUBLISHER_URL` = the Publisher base URL, for example `https://publisher.smarbiz.sbs`
- `PUBLISHER_AUTOMATION_TOKEN` = the same long random token configured as `PUBLISHER_AUTOMATION_TOKEN` in the Publisher server environment

`release-request.json` is intentionally committed with `"enabled": false`. To queue a build, set a new version/build number and `"enabled": true`, then commit it. The GitHub workflow calls Publisher and queues Android and iOS build jobs for the exact commit.
