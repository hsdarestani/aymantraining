#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

: "${ANDROID_KEYSTORE_PATH:?ANDROID_KEYSTORE_PATH is required on the Publisher Linux agent}"
: "${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD is required on the Publisher Linux agent}"
: "${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS is required on the Publisher Linux agent}"
: "${ANDROID_KEY_PASSWORD:?ANDROID_KEY_PASSWORD is required on the Publisher Linux agent}"

if [ ! -f "$ANDROID_KEYSTORE_PATH" ]; then
  echo "Android keystore not found at $ANDROID_KEYSTORE_PATH" >&2
  exit 2
fi

npm ci
node ./scripts/prepare-native-config.mjs --require-firebase
npx expo prebuild --platform android --clean --non-interactive
node ./scripts/configure-android-signing.mjs

cd android
chmod +x gradlew
./gradlew --no-daemon clean bundleRelease

test -n "$(find app/build/outputs/bundle/release -name '*.aab' -print -quit)"
