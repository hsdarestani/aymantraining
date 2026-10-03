# BE DIFFERENT native app

The native app uses Expo / React Native and the production API at bedifferent.smarbiz.sbs.

Implemented without external credentials:
- bearer session stored in SecureStore
- live dashboard API
- Apple HealthKit adapter
- Android Health Connect adapter
- health-data consent enforcement server-side
- workout/backend APIs shared with web
- native haptics can be added without changing API

Native dependencies are pinned around Expo SDK 53. HealthKit is pinned to 13.4.0 rather than the newer v14 line because v14 has a reported cold-start authorization-sheet regression; this must be re-evaluated during the signed-device QA cycle.

Still requires external account/configuration before store release:
- Apple Developer signing, HealthKit capability/provisioning and App Store Connect
- Google Play signing/project
- FCM/APNs credentials
- RevenueCat public SDK keys/products
