#!/usr/bin/env bash
# Android Store candidate smoke: install the exact APK and prove ten clean cold starts.
set -euo pipefail
package="com.smarbiz.bedifferent"
apk="android/app/build/outputs/apk/debug/app-debug.apk"
out="build/step15"
mkdir -p "$out"
test -s "$apk"
adb wait-for-device
test "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1"
adb install -r "$apk"

for attempt in $(seq 1 10); do
  adb shell am force-stop "$package"
  adb logcat -c
  if ! adb shell monkey -p "$package" -c android.intent.category.LAUNCHER 1 > "$out/launch-$attempt.txt" 2>&1; then
    cat "$out/launch-$attempt.txt"
    echo "::error::Android launch command failed at cold start $attempt"
    exit 1
  fi
  sleep 9
  adb logcat -d -v time > "$out/cold-start-$attempt.log"
  if grep -E -A 16 "FATAL EXCEPTION|Fatal signal|Force finishing activity.*$package" "$out/cold-start-$attempt.log" > "$out/fatal-$attempt.txt"; then
    cat "$out/fatal-$attempt.txt"
    echo "::error::Android fatal log detected at cold start $attempt"
    exit 1
  fi
  if ! adb shell pidof "$package" > "$out/pid-$attempt.txt"; then
    echo "::error::BE DIFFERENT exited after cold start $attempt"
    tail -n 150 "$out/cold-start-$attempt.log"
    exit 1
  fi
  echo "Verified Android cold start $attempt/10"
done
