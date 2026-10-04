# BE DIFFERENT · Publisher Release Setup

## App record

Create the two store records manually first, then create one app in Publisher:

- Name: `BE DIFFERENT`
- Platform: `Android + iOS`
- Framework: `React Native`
- Repository: `https://github.com/hsdarestani/aymantraining`
- Branch: `main`
- Android package: `com.smarbiz.bedifferent`
- iOS bundle ID: `com.smarbiz.bedifferent`
- Privacy URL: `https://bedifferent.smarbiz.sbs/legal/privacy`
- Support URL: `https://bedifferent.smarbiz.sbs/`
- Marketing URL: `https://bedifferent.smarbiz.sbs/`
- Requires login: enabled

Publisher supplies `APP_VERSION_NAME` and `APP_BUILD_NUMBER` to each build. `mobile/app.config.ts` maps them into Android versionCode and iOS buildNumber.

## Publisher build config

Use this build config in the BE DIFFERENT app record:

```json
{
  "android_command": "bash mobile/scripts/build-android.sh",
  "android_artifact": "mobile/android/app/build/outputs/bundle/release/*.aab",
  "ios_command": "bash mobile/scripts/build-ios.sh",
  "ios_artifact": "mobile/ios/build/export/*.ipa",
  "env": {
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_EAS_PROJECT_ID": "SET_IN_PUBLISHER"
  }
}
```

The three `EXPO_PUBLIC_*` values are build-time SDK identifiers and are safe to embed in the app binary. Store private keys and signing passwords must not be placed in this JSON.

## Android Publisher agent

The Linux agent needs Node 22, JDK 17 and Android SDK.

Create one upload keystore and store it only on the agent. The agent environment must contain:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The build script runs a clean Expo Android prebuild, injects release signing from those environment variables and produces a signed AAB.

Google Play upload is handled by Publisher with a Google service-account JSON stored in the Publisher Store Account, not in the app repo or build config.

## iOS Publisher agent

The macOS agent needs Node 22, CocoaPods and a current Xcode.

Agent environment:

- `APPLE_TEAM_ID`
- `ASC_KEY_PATH`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`

`ASC_KEY_PATH` points to the App Store Connect Team API `.p8` file stored securely on the Mac. The same Team API key can also be stored in Publisher's Apple Store Account for upload, processing checks and metadata automation.

The iOS build script performs a clean Expo iOS prebuild, automatic signing, archive and App Store export. It verifies an IPA exists before the job succeeds.

## Store products

Create:

- `bd_pro_monthly`
- `bd_pro_yearly`

Both grant RevenueCat entitlement `pro`.

Configure the 7-day trial in App Store Connect and Google Play. Do not rely on the internal test-trial endpoint once RevenueCat production credentials are connected.

RevenueCat webhook:

`https://bedifferent.smarbiz.sbs/api/webhooks/revenuecat`

Authorization:

`Bearer <REVENUECAT_WEBHOOK_SECRET>`

## Review account

Before submission create a dedicated Athlete review account, complete onboarding and provide the credentials in App Review / Play review instructions. If reviewers need PRO-only flows, grant that review account PRO or use a store sandbox subscription.
