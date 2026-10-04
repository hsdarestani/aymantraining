# BE DIFFERENT · Publisher Release

BE DIFFERENT is built through A+ Publisher from:
`https://github.com/hsdarestani/aymantraining`

Stable identifiers:

- Android package: `com.smarbiz.bedifferent`
- iOS bundle ID: `com.smarbiz.bedifferent`
- Product IDs: `bd_pro_monthly`, `bd_pro_yearly`

Publisher auto-bootstraps the BE DIFFERENT app record when the first authenticated release request arrives. The generated build configuration is:

```json
{
  "android_command": "bash mobile/scripts/build-android.sh",
  "android_artifact": "mobile/android/app/build/outputs/bundle/release/*.aab",
  "ios_command": "bash mobile/scripts/build-ios.sh",
  "ios_artifact": "mobile/ios/build/export/*.ipa",
  "env": {}
}
```

## Android cloud builder

The Firebase Android client config is committed at `mobile/firebase/google-services.json`.

Publisher keeps the Android signing material encrypted. No Firebase client config secret is required for Android builds.

Publisher GitHub repository secrets:

- `BEDIFFERENT_ANDROID_KEYSTORE_B64`
- `BEDIFFERENT_ANDROID_KEYSTORE_PASSWORD`
- `BEDIFFERENT_ANDROID_KEY_ALIAS`
- `BEDIFFERENT_ANDROID_KEY_PASSWORD`

The Linux cloud agent reconstructs `google-services.json` and the upload keystore only for the build job. Neither file is committed.

## iOS cloud builder

The Firebase iOS client config is committed at `mobile/firebase/GoogleService-Info.plist`.

Publisher uses its connected Apple Store account and signing automation for the iOS build.

Publisher GitHub repository secrets:

- `BEDIFFERENT_APPLE_TEAM_ID`
- `BEDIFFERENT_ASC_KEY_ID`
- `BEDIFFERENT_ASC_ISSUER_ID`
- `BEDIFFERENT_ASC_PRIVATE_KEY_B64`

The macOS cloud agent uses the committed `GoogleService-Info.plist` and the connected App Store Connect account. Xcode automatic signing is used.

## Store accounts inside Publisher

Google Store Account:
- store the full Google Play service-account JSON as the encrypted credential
- give that service account access to the BE DIFFERENT app in Play Console

Apple Store Account:
- Issuer ID
- Key ID
- Team ID
- App Store Connect Team API private key

These Store Accounts are used for upload, store status and later submission automation. Native build signing values remain GitHub Secrets on the Publisher repository.

## Triggering a build

The BE DIFFERENT repository has `release-request.json`. Keep `enabled=false` until credentials are complete.

When ready:
1. set version and build number
2. set `enabled=true`
3. commit

`.github/workflows/publisher-release.yml` calls:
`POST /apps/automation/release/`

Required BE DIFFERENT repository secrets:
- `PUBLISHER_URL=https://publisher.smarbiz.sbs`
- `PUBLISHER_AUTOMATION_TOKEN`

The same automation token must exist in Publisher production.

## Store billing

There is no RevenueCat.

- iOS purchase: StoreKit through `react-native-iap`
- Android purchase: Google Play Billing through `react-native-iap`
- Backend verifies Apple with App Store Server API
- Backend verifies Google with Android Publisher API
- transaction is finished only after backend verification succeeds

Store trial is configured in App Store Connect and Google Play, not as a production backend trial.

## Push

There is no Expo Push service.

- Native app uses Firebase Messaging
- Android: FCM
- iOS: FCM token delivered through APNs
- Backend sends directly with Firebase Admin

## Media and email

- private media is stored on the BE DIFFERENT VPS volume
- database and media are backed up daily on the VPS with 14 day retention
- email is sent through Strato SMTP
