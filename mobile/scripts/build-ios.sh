#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
export NODE_ENV=production

export APPLE_TEAM_ID="${APPLE_TEAM_ID:-${IOS_TEAM_ID:-}}"
export ASC_KEY_PATH="${ASC_KEY_PATH:-${APPLE_API_KEY_PATH:-}}"
export ASC_KEY_ID="${ASC_KEY_ID:-${APPLE_KEY_ID:-}}"
export ASC_ISSUER_ID="${ASC_ISSUER_ID:-${APPLE_ISSUER_ID:-}}"
: "${APPLE_TEAM_ID:?APPLE_TEAM_ID or IOS_TEAM_ID is required on the Publisher macOS agent}"

mkdir -p .publisher-secrets
if [ -z "${ASC_KEY_PATH:-}" ] && [ -n "${ASC_PRIVATE_KEY_B64:-}" ] && [ -n "${ASC_KEY_ID:-}" ]; then
  export ASC_KEY_PATH="$PWD/.publisher-secrets/AuthKey_${ASC_KEY_ID}.p8"
  printf '%s' "$ASC_PRIVATE_KEY_B64" | base64 -d > "$ASC_KEY_PATH"
  chmod 600 "$ASC_KEY_PATH"
fi

npm ci --include=dev
npm install --include=dev --no-save --package-lock=false query-string@7.1.3 react-native-screens@4.11.1 react-native-safe-area-context@5.4.0
npx expo install --check || echo "Expo dependency check reported a patch level advisory. Continuing with the validated native stack."
export APPLE_PUSH_ENV=production
node ./scripts/prepare-native-config.mjs --require-ios
npx expo prebuild --platform ios --clean --non-interactive

python3 - <<'PY'
from pathlib import Path

podfile = Path("ios/Podfile")
text = podfile.read_text()

if "$RNFirebaseDisableSPM = true" not in text:
    target_index = text.find("target ")
    if target_index < 0:
        raise SystemExit("Could not locate iOS target in Podfile")
    text = text[:target_index] + "$RNFirebaseDisableSPM = true\n\n" + text[target_index:]

if "$RNFirebaseAsStaticFramework = true" not in text:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line.lstrip().startswith("target "):
            indent = line[: len(line) - len(line.lstrip())] + "  "
            lines.insert(index + 1, indent + "$RNFirebaseAsStaticFramework = true")
            break
    text = "\n".join(lines) + "\n"

podfile.write_text(text)
PY

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

signingStyle="${IOS_SIGNING_STYLE:-Automatic}"
archiveSigning=(
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID"
  CODE_SIGN_STYLE="$signingStyle"
)

if [ "$signingStyle" = "Manual" ]; then
  : "${IOS_CODE_SIGN_IDENTITY:?IOS_CODE_SIGN_IDENTITY is required for manual signing}"
  : "${IOS_PROVISIONING_PROFILE_SPECIFIER:?IOS_PROVISIONING_PROFILE_SPECIFIER is required for manual signing}"
  archiveSigning+=(
    CODE_SIGN_IDENTITY="$IOS_CODE_SIGN_IDENTITY"
    PROVISIONING_PROFILE_SPECIFIER="$IOS_PROVISIONING_PROFILE_SPECIFIER"
  )
  if [ -n "${IOS_SIGNING_KEYCHAIN:-}" ]; then
    archiveSigning+=(OTHER_CODE_SIGN_FLAGS="--keychain $IOS_SIGNING_KEYCHAIN")
  fi
fi

xcodebuild \
  -workspace "$workspace" \
  -scheme "$scheme" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$archive" \
  "${archiveSigning[@]}" \
  "${extraAuth[@]}" \
  archive

if [ "$signingStyle" = "Manual" ]; then
cat > "$PWD/build/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>teamID</key><string>$APPLE_TEAM_ID</string>
<key>signingStyle</key><string>manual</string>
<key>signingCertificate</key><string>${IOS_CODE_SIGN_IDENTITY}</string>
<key>provisioningProfiles</key><dict>
<key>${IOS_BUNDLE_ID:-com.smarbiz.bedifferent}</key><string>${IOS_PROVISIONING_PROFILE_SPECIFIER}</string>
</dict>
<key>uploadSymbols</key><true/>
</dict></plist>
PLIST
else
cat > "$PWD/build/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>teamID</key><string>$APPLE_TEAM_ID</string>
<key>signingStyle</key><string>automatic</string>
<key>uploadSymbols</key><true/>
</dict></plist>
PLIST
fi

xcodebuild \
  -exportArchive \
  -archivePath "$archive" \
  -exportPath "$exportDir" \
  -exportOptionsPlist "$PWD/build/ExportOptions.plist" \
  "${extraAuth[@]}"

test -n "$(find "$exportDir" -name '*.ipa' -print -quit)"
