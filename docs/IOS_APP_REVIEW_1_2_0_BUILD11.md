# BE DIFFERENT iOS App Review · 1.2.0 (11)

Review received October 12, 2026, for 1.2.0 (10), tested on iPad Air 11-inch M3.

## Adjustments for build 11
- Removed every Google Play and Android-store purchase reference from the native membership experience.
- The iOS app does not offer in-app purchases or a free trial yet. Removed disabled purchase and restore buttons, paywall CTAs and the mandatory onboarding jump to a nonfunctional purchase screen.
- Account status remains available as a read-only informational page.
- Made Apple Health explicit in Settings, Athlete/Gadgets and the Wearables screen, and in the dashboard synchronization prompt.
- Apple Health integration reads *only* user-authorized activity, sleep and related metrics after consent; the app does not write to Apple Health.
- The native app version remains 1.2.0, but its iOS build number is now 11.
- Kept automatic App Store review submission disabled for this corrective build until App Store Connect's unfinished IAP items are detached from the app-version review submission.

## Manual App Store Connect requirements
1. Open **Be Different > App Review / Draft Submissions** and ensure that the 1.2.0 build-11 submission **does not contain any unfinished IAP or subscription products**. Those products are intentionally deferred for a future release.
2. Under the iOS version, select the new build 11, check the App Review Information, then add the version for review and submit.
3. If Apple still requires IAP products, verify that none are attached to the submitted version; do not claim a purchase flow is implemented.
4. In review notes: **Settings > Apple Health** or **Athlete > Apple Health & Gadgets** demonstrates HealthKit user controls. Connect and synchronize only with explicit permission. Use a physical device for HealthKit permission tests.
5. If payments are intentionally restored in a later release, implement actual StoreKit purchase + restore flows and send the first IAP/subscription and its screenshot for review with a new app binary.

## Suggested App Review response
Hello App Review Team,

Thank you for the detailed review. In our updated iOS build 1.2.0 (11) we removed references to Google Play and the incomplete in-app purchase interface. This build does not offer subscriptions or in-app purchases; the subscription products are deferred to a future update and should not be included in the current app submission.

We also made Apple Health access clear and accessible in the app. After signing in, open **Settings > Apple Health** or **Athlete > Apple Health & Gadgets**. The screen explains which Apple Health data can be imported, why they are used and how to manage access. Syncing requires explicit user authorization, and the app does not write to Apple Health.

Please review the new build. Thank you.
