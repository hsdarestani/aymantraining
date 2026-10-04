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

Set these values in the Publisher app build config `env` because they are build-time public identifiers/SDK keys:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

Do not put App Store Connect private keys, Google service-account JSON, RevenueCat secret API keys, webhook secrets, keystore passwords, or server secrets in this build-config JSON.

## Recommended Android build config

The Linux build agent needs Node 22, JDK 17, Android SDK, and the normal React Native/Expo Android toolchain.

```json
{
  "android_command": "cd mobile && npm ci && npx expo prebuild --platform android --clean --non-interactive && cd android && chmod +x gradlew && ./gradlew bundleRelease",
  "android_artifact": "mobile/android/app/build/outputs/bundle/release/*.aab",
  "env": {
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "SET_IN_PUBLISHER",
    "EXPO_PUBLIC_EAS_PROJECT_ID": "SET_IN_PUBLISHER"
  }
}
```

The Android release signing key must be installed on the Android build agent before the first production build. Do not commit the keystore.

## Recommended iOS bootstrap

The macOS agent needs Node 22 and a current Xcode. On the first iOS build:

1. Clone the repository on the Mac agent.
2. Run `cd mobile && npm ci && npx expo prebuild --platform ios --clean --non-interactive`.
3. Open the generated workspace once in Xcode.
4. Select the BE DIFFERENT target, the correct Apple Team and automatic signing.
5. Confirm bundle ID `com.smarbiz.bedifferent`, HealthKit capability and Push Notifications capability.
6. Build/archive once successfully on that Mac.

After this bootstrap, set the Publisher iOS build command to the archive/export command used by that Mac agent. Publisher can then upload the resulting IPA with its App Store Connect credentials.

## Store products

Create these subscription products before enabling live billing:

- `bd_pro_monthly`
- `bd_pro_yearly`

Both must grant the RevenueCat entitlement `pro`. Configure the 7 day trial in App Store Connect / Google Play, not only in application code.

RevenueCat webhook:
`https://bedifferent.smarbiz.sbs/api/webhooks/revenuecat`

Use an Authorization header:
`Bearer <REVENUECAT_WEBHOOK_SECRET>`

## Review account

Create a dedicated review Athlete account after production secrets are connected. Complete onboarding and make sure the account can demonstrate FREE screens. A separate PRO review account can be enabled for coach, wearable-detail and subscription-dependent screens if the store review notes require it.
