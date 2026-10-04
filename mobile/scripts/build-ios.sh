#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

: "${APPLE_TEAM_ID:?APPLE_TEAM_ID is required on the Publisher macOS agent}"

npm ci
export APPLE_PUSH_ENV=production
node ./scripts/prepare-native-config.mjs --require-firebase
npx expo prebuild --platform ios --clean --non-interactive

cd ios
if command -v pod >/dev/null 2>&1; then
  pod install --repo-update
fi

workspace="$(find . -maxdepth 2 -name '*.xcworkspace' -print -quit)"
if [ -z "$workspace" ]; then
  echo "No Xcode workspace found" >&2
  exit 2
fi

scheme="${IOS_SCHEME:-}"
if [ -z "$scheme" ]; then
  scheme="$(xcodebuild -list -json -workspace "$workspace" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("workspace",{}).get("schemes") or [""])[0])')"
fi
if [ -z "$scheme" ]; then
  echo "Could not determine iOS scheme" >&2
  exit 2
fi

archive="$PWD/build/BE-DIFFERENT.xcarchive"
exportDir="$PWD/build/export"
rm -rf "$archive" "$exportDir"
mkdir -p "$exportDir"

extraAuth=()
if [ -n "${ASC_KEY_PATH:-}" ] && [ -n "${ASC_KEY_ID:-}" ] && [ -n "${ASC_ISSUER_ID:-}" ]; then
  extraAuth+=(
    -authenticationKeyPath "$ASC_KEY_PATH"
    -authenticationKeyID "$ASC_KEY_ID"
    -authenticationKeyIssuerID "$ASC_ISSUER_ID"
  )
fi

xcodebuild   -workspace "$workspace"   -scheme "$scheme"   -configuration Release   -destination "generic/platform=iOS"   -archivePath "$archive"   DEVELOPMENT_TEAM="$APPLE_TEAM_ID"   CODE_SIGN_STYLE=Automatic   -allowProvisioningUpdates   "${extraAuth[@]}"   archive

cat > "$PWD/build/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>$APPLE_TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
PLIST

xcodebuild   -exportArchive   -archivePath "$archive"   -exportPath "$exportDir"   -exportOptionsPlist "$PWD/build/ExportOptions.plist"   -allowProvisioningUpdates   "${extraAuth[@]}"

test -n "$(find "$exportDir" -name '*.ipa' -print -quit)"
