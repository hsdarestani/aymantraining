# BE DIFFERENT · iOS App Review 2.1(b) · Build 12

## Confirmed rejection
Apple rejected iOS 1.2.0 (11), October 14, 2026, tested on iPad Air 11-inch (M3), iPadOS 27.0.1.
Exact finding: The 'Pro freischalten' button did not take any action to initiate an In-App Purchase.

## Root cause
Build 11 intentionally made `/membership` a **read-only account status** page because iOS IAP is not implemented yet. However, native locked-feature screens still showed `PRO FREISCHALTEN` and navigated to `/membership`, leaving a misleading purchase CTA.

## Remediation
- Coach tab locked screen: no purchase CTA.
- Different AI locked screen: no purchase CTA.
- Performance Timeline locked screen: no purchase CTA; back navigation stays available.
- BE RESTED Lifestyle recovery gate: no purchase CTA.
- Check-in: informative locked state instead of redirect to an account status screen that cannot purchase.
- The `/membership` page remains informational, never advertises or takes payments.
- CI `ios-review-pro-gates.yml` scans **all** React Native app route source files for stale PRO purchase CTAs and redirects.
- `mobile/app.json` / `release-request.json` moved to iOS build 12, auto-submit disabled.

## Mandatory manual release checklist
1. Review the PR and run the typecheck / UI gating regression suite (must be green).
2. Confirm **App Store Connect > App Review / current submission** does not include IAP or subscription products for this release. Detach unimplemented IAP products from the current submission. Do not delete catalog products unnecessarily.
3. Build a signed **1.2.0 (12)** archive from merged main. Do not resubmit build 11: it contains the rejected buttons.
4. Test signed build on iPad/iPhone, free athlete account. Open Coach, Different AI, BE RESTED, and performance timeline; verify no `Pro freischalten` or other inoperative purchase CTA; confirm navigation works. Review with EN locale too.
5. Submit the **new binary** in App Store Connect with a note clearly explaining that iOS IAP is intentionally unavailable in this release; no unfinished IAP/subscription products must be attached.
6. Check all other live App Review items are resolved before sending. Do not claim completion until Apple approves.

## Suggested message for App Review
Hello App Review Team,

Thank you for your feedback on build 1.2.0 (11). You were correct: the "Pro freischalten" action remained in several feature-gated screens even though the purchase flow is not offered in the current iOS release.

In the corrected binary 1.2.0 (12), we have removed these inactive purchase actions and all misleading purchase navigation. The affected screens now show informational feature availability states. In-app purchases and subscriptions are deferred and must not be included in this submission. The account status page is informational only.

We have also reviewed the affected navigation and tested it on iOS. Thank you for reviewing the updated build.

Note: Only use the final sentence about testing after a real iPad/iPhone acceptance test has passed.
