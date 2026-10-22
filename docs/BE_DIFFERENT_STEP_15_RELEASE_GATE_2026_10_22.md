# BE DIFFERENT — Step 15: Final QA, signed builds, distribution

Target 1.3.0 (build 21); source hsdarestani/aymantraining main. Live web app is the **isolated** \`/opt/bedifferent-temp/current\` systemd service on the A+ Esthetic shared VPS. The standalone Docker deploy.yml is unsafe on this host and must never be used there.

## Evidence required, not assumed
1. Complete Product Quality Gate (web, Playwright operation tests, media authorization, migrations, account roles, health normalization, native outbox and language).
2. Steps 08, 11, 12, 13 and 14 dedicated regression checks on the **exact release source SHA**.
3. Release Acceptance checks real ready endpoints for BE DIFFERENT, Esthetic and booking; separate service isolation and feature flags 11–14.
4. Native Check: Expo generation, TypeScript, Android Gradle, iOS simulator and companions, Wear OS.
5. Local/simulator store-candidate artifacts. Debug APK and simulator archive **are not** signed production releases. Signed AAB, IPA, push entitlements, App Store Connect/Google Play uploads must be verified separately.
6. Publisher request must use exact version/build across mobile/app.json and release-request.json, have platform IDs fixed, and await all required GitHub checks for the exact SHA. Do not use the obsolete v1.2.8 request.
7. Production release is not equivalent to Play listing, TestFlight processing or App Store review approval. Publish/approval should be reflected in real Publisher and Apple/Google status before claiming it.

## Manual real-device QA (cannot be proven by compiler)
- iPhone fresh install, login, approved notifications, health permission/denial, back/deep links, offline retry, 10 cold starts.
- Android fresh install, background/foreground/deep links, gallery/camera, Health Connect/permission denial, 10 cold starts.
- FREE and PRO gated chapter tests, trainer approval, entitlement on direct media URLs, coach feedback.
- Women dashboard opt-out, cycle consent/share/delete and data export; verify no sensitive data in notifications.
- Streak evidence/recovery/milestones, repeat acknowledgement, manual and OS reduced-motion settings, no interruptions mid-timer.
- Google Play/internal release and TestFlight review, signing provisioning and billing checks. Actual store approval requires external review.
- Rollback: use previous \`/opt/bedifferent-temp/current\` release, keep DB/media/env backups and verify \`/api/ready\` + Esthetic/booking. No destructive migration.

## Release policy
The Publisher workflow remains disabled until a distinct release-request commit explicitly switches \`enabled\` to true. That commit triggers a fail-closed approval gate: source-matched quality, security, native and dedicated regressions must pass first. Then it sends a single authenticated request to the existing Publisher; monitor actual build and submission separately. Apple/Google release approval is controlled by the stores.
