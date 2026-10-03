# BE DIFFERENT architecture decisions

## Phase 1

The first release follows the product brief and stays rule based. AI is not allowed to silently change a plan. Coach approval remains the final step for meaningful training-plan changes.

### Client apps
- Web: Next.js for the coach panel and the currently deployed responsive athlete alpha
- Native: React Native / Expo for iOS and Android
- Launch language: German
- English reserved mainly for brand terms

### Backend
- PostgreSQL is the system of record
- Prisma is used for the initial domain model
- Server-side feature flags separate FREE and PRO
- Score weights and rule thresholds stay configurable, never hard coded in clients

### Score
Initial weights follow the brief:
- Strength 20
- Endurance 15
- Athleticism 15
- Mobility 10
- Recovery 15
- Fuel 10
- Consistency 15

Missing wearable values must not create invented values. The score is recalculated from available inputs and exposes data completeness.

### Wearables
- iOS: Apple HealthKit
- Android: Health Connect
- Aggregator integration is prepared for Garmin, Polar, Suunto, Coros, WHOOP, Oura and Fitbit

### Media
Exercise model supports Start, Middle and End images plus one short coach video.

### Safety and privacy
- Lifestyle and training recommendations, no diagnosis
- explicit consent for health data
- export and deletion flows required before public launch
- progress photos and technique videos visible only to athlete and assigned coach
- EU hosting required
