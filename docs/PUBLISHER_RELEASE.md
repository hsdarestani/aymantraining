# BE DIFFERENT · Publisher Release Setup

## App record

Create the first store records manually, then create one app in Publisher with:

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

Publisher automatically provides `APP_VERSION_NAME` and `APP_BUILD_NUMBER`; `mobile/app.config.ts` maps those values into Android versionCode and iOS buildNumber.

## Native build environment

Set these values in the Publisher app build config `env`. They are build-time SDK identifiers and are expected inside the binary:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

Do not put App Store Connect private keys, Google service-account JSON, RevenueCat secret API keys, webhook secrets, keystore passwords, or signing certificates in the app build-config JSON.

## Android build

The Linux agent needs Node 22, JDK 17, Android SDK and the React Native / Expo Android toolchain.

Use:

```json
{
  "android_command": "bash mobile/scripts/build-android.sh",
  "android_artifact": "mobile/android/app/build/outputs/bundle/release/*.aab",
  "env": {
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_EAS_PROJECT_ID": "SET_IN_PUBLISHER"
  }
}
```

The following **secrets live only on the Linux build agent environment**, not in Git or build_config:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

`build-android.sh` performs a clean Expo prebuild, injects release signing into the generated Gradle project, and produces a signed AAB.

## iOS build

The macOS agent needs Node 22, CocoaPods and a current Xcode accepted by App Store Connect.

Use:

```json
{
  "ios_command": "bash mobile/scripts/build-ios.sh",
  "ios_artifact": "mobile/ios/build/export/*.ipa",
  "env": {
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_EAS_PROJECT_ID": "SET_IN_PUBLISHER"
  }
}
```

Required on the macOS build-agent environment:

- `APPLE_TEAM_ID`
- optional `IOS_SCHEME` if automatic scheme detection does not select the correct scheme

For fully unattended provisioning, install the App Store Connect API private key on the macOS agent and provide:

- `ASC_KEY_PATH`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`

Alternatively, bootstrap signing once in Xcode with automatic signing and keep the distribution certificate/private key and provisioning setup in the build-agent keychain.

## Publisher Store Accounts

Publisher already encrypts Store Account credentials in its database.

### Apple Store Account

Enter in Publisher:

- Apple Issuer ID
- Apple Key ID
- App Store Connect private key contents from the downloaded `.p8`
- Apple Team ID
- Vendor Number only if report synchronization is desired

The key needs enough App Store Connect permissions for app metadata, builds and submissions.

### Google Store Account

Create a Google Cloud service account and download its JSON key. In Publisher, store the **whole JSON credentials object** as the Google Store Account credential. The service account email must also be invited in Play Console with the app permissions required for publishing. The Google Play Developer API must be enabled in the Cloud project used by that service account.

## Store products

Create these auto-renewable subscription products before enabling live billing:

- `bd_pro_monthly`
- `bd_pro_yearly`

Both grant RevenueCat entitlement `pro`. Configure the 7 day trial at store level.

RevenueCat webhook:

`https://bedifferent.smarbiz.sbs/api/webhooks/revenuecat`

Authorization header:

`Bearer <REVENUECAT_WEBHOOK_SECRET>`

## Review account

Create a dedicated review Athlete account after production integrations are connected. Complete onboarding and make sure the account can demonstrate FREE screens. Keep a separate PRO review account if the review team needs to inspect coach, advanced wearable and subscription-only functionality.
