# BE DIFFERENT · Store Setup ادامه کار

App Recordها در Apple و Google ساخته شده‌اند. شناسه ثابت هر دو:
`com.smarbiz.bedifferent`

## Apple

### 1. Subscription
در App Store Connect یک Subscription Group برای PRO بساز و داخل آن:
- `bd_pro_monthly` · 1 Month
- `bd_pro_yearly` · 1 Year

برای هر دو قیمت و localization ثبت کن و Introductory Offer رایگان 7 روزه را فعال کن.

### 2. App Store Connect Team API Key برای Publisher
در Users and Access > Integrations یک Team API Key با دسترسی لازم برای build/upload بساز.
لازم داریم:
- Issuer ID
- Key ID
- Team ID
- فایل `.p8`

### 3. In-App Purchase API Key برای backend
در Users and Access > Integrations > In-App Purchase یک IAP key بساز.
لازم داریم:
- IAP Issuer ID
- IAP Key ID
- IAP `.p8`

این key برای سرور است و با Team API key Publisher یکی فرض نمی‌شود.

### 4. Server Notifications
App Store Server Notifications V2:
`https://bedifferent.smarbiz.sbs/api/webhooks/apple`
را برای Production و Sandbox تنظیم کن.

### 5. Firebase / Push
در Firebase همان project مورد استفاده برای Push:
- iOS app با bundle `com.smarbiz.bedifferent`
- `GoogleService-Info.plist` دانلود کن
- در Firebase Cloud Messaging، APNs Auth Key اپل را برای iOS app وصل کن

## Google

### 1. Subscription
در Play Console:
- `bd_pro_monthly`
- `bd_pro_yearly`

برای هر کدام base plan فعال و pricing/regions را تنظیم کن و offer هفت روزه بساز.

### 2. Service Account
Google Play Developer API را در Cloud project فعال کن.
یک Service Account بساز و JSON key بگیر.
همان service-account email را در Play Console برای BE DIFFERENT دعوت کن و دسترسی لازم برای release و subscriptions/orders بده.

JSON برای دو مصرف استفاده می‌شود:
- Publisher upload به Google Play
- backend verification خرید

### 3. Firebase / Push
در Firebase:
- Android app با package `com.smarbiz.bedifferent`
- `google-services.json` دانلود کن
- Firebase Admin service-account JSON برای backend بگیر

### 4. Real-time Developer Notifications
یک Pub/Sub topic و push subscription بساز و RTDN Play را به آن topic وصل کن.
Push endpoint:
`https://bedifferent.smarbiz.sbs/api/webhooks/google-play?token=<random-secret>`

## Android signing

برای اولین AAB یک upload keystore ثابت لازم است. Publisher می‌تواند آن را در هر ephemeral Linux build از Base64 بازسازی کند. اصل keystore و رمزهایش باید دائمی و امن نگهداری شوند.

## Email

بعد از ساخت mailbox روی Strato فقط SMTP host/port/user/password/from لازم است. Backend مستقیم SMTP می‌فرستد.

## Build

وقتی credentialها ست شدند:
- Publisher app record در اولین release request خودکار ساخته/به‌روزرسانی می‌شود
- `release-request.json` از false به true تغییر می‌کند
- Publisher Android AAB و iOS IPA را queue می‌کند
