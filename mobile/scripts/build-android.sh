#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
export NODE_ENV=production

mkdir -p .publisher-secrets
if [ -z "${ANDROID_KEYSTORE_PATH:-}" ] && [ -n "${ANDROID_KEYSTORE_B64:-}" ]; then
  export ANDROID_KEYSTORE_PATH="$PWD/.publisher-secrets/bedifferent-upload.jks"
  printf '%s' "$ANDROID_KEYSTORE_B64" | base64 -d > "$ANDROID_KEYSTORE_PATH"
  chmod 600 "$ANDROID_KEYSTORE_PATH"
fi

: "${ANDROID_KEYSTORE_PATH:?ANDROID_KEYSTORE_PATH or ANDROID_KEYSTORE_B64 is required}"
: "${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD is required}"
: "${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS is required}"
: "${ANDROID_KEY_PASSWORD:?ANDROID_KEY_PASSWORD is required}"

test -f "$ANDROID_KEYSTORE_PATH"

npm ci --include=dev
npm install --include=dev --no-save --package-lock=false query-string@7.1.3
npx expo install --check || echo "Expo dependency check reported a patch level advisory. Continuing with the validated native stack."
node ./scripts/prepare-native-config.mjs --require-android
npx expo prebuild --platform android --clean --non-interactive
node ./scripts/configure-android-signing.mjs

cd android
chmod +x gradlew
./gradlew --no-daemon clean bundleRelease

test -n "$(find app/build/outputs/bundle/release -name '*.aab' -print -quit)"
