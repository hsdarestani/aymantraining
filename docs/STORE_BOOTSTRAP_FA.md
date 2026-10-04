# راه‌اندازی اولیه Store برای BE DIFFERENT

این فایل هیچ Secret واقعی نگه نمی‌دارد.

## شناسه‌های ثابت

- Android package: `com.smarbiz.bedifferent`
- iOS bundle ID: `com.smarbiz.bedifferent`
- App name: `BE DIFFERENT`
- Privacy: `https://bedifferent.smarbiz.sbs/legal/privacy`
- Support: `https://bedifferent.smarbiz.sbs/`

## Apple

1. در Apple Developer وارد Certificates, Identifiers & Profiles شوید.
2. یک Explicit App ID با Bundle ID برابر `com.smarbiz.bedifferent` بسازید.
3. برای همان App ID قابلیت‌های HealthKit و Push Notifications را فعال کنید. In-App Purchase برای Explicit App ID در دسترس است.
4. در App Store Connect بخش Apps روی + و New App بزنید.
5. Platform را iOS انتخاب کنید.
6. Name را BE DIFFERENT قرار دهید.
7. Primary language را German یا زبان اصلی موردنظر انتخاب کنید.
8. Bundle ID همان `com.smarbiz.bedifferent` باشد.
9. SKU پیشنهادی: `bedifferent-ios-001`.
10. App را Create کنید. قبل از upload build باید این record وجود داشته باشد.
11. Privacy URL و اطلاعات پایه را ثبت کنید.
12. چون دسته Health & Fitness است، وضعیت regulated medical device را با واقعیت محصول تکمیل کنید. اپ فعلی به عنوان coaching/lifestyle طراحی شده و تشخیص پزشکی ارائه نمی‌کند.
13. در Monetization > Subscriptions یک Subscription Group مثل `BE DIFFERENT PRO` بسازید.
14. دو Auto-Renewable Subscription داخل همان group بسازید:
    - `bd_pro_monthly` با مدت 1 Month
    - `bd_pro_yearly` با مدت 1 Year
15. قیمت‌ها و localization را تنظیم کنید.
16. برای Trial، Introductory Offer از نوع Free با مدت 7 Days برای storefrontهای موردنظر فعال کنید.
17. اولین subscription همراه اولین نسخه اپ برای review ارسال می‌شود.
18. در Users and Access > Integrations برای App Store Connect API دسترسی بگیرید و Team API Key بسازید.
19. این چهار مقدار را برای Publisher آماده کنید:
    - Issuer ID
    - Key ID
    - فایل خصوصی `.p8`
    - Team ID

## Google Play

1. وارد Play Console شوید و Home > Create app را بزنید.
2. Default language، نام BE DIFFERENT، نوع App و Free را انتخاب کنید.
3. Support email را وارد کنید.
4. Declarationها و Play App Signing terms را قبول و Create app را بزنید.
5. Package name بعد از upload اولین AAB باید `com.smarbiz.bedifferent` باشد؛ این شناسه را عوض نکنید.
6. App content، Data safety، Health/fitness declarations، privacy URL، age/content rating و Store Listing را تکمیل کنید.
7. برای Publisher یک Google Cloud Project بسازید.
8. در Google Cloud، Google Play Developer API را Enable کنید.
9. یک Service Account بسازید و JSON key آن را دانلود کنید.
10. در Play Console > Users and permissions > Invite new users، ایمیل Service Account را دعوت کنید و دسترسی همین App و permissionهای لازم برای release/publishing را بدهید.
11. برای RevenueCat/Billing دسترسی‌های View financial data/orders/cancellation survey responses و Manage orders and subscriptions نیز لازم می‌شوند.
12. در Monetize with Play > Products > Subscriptions محصولات را بسازید:
    - subscription/product ID مورد استفاده: `bd_pro_monthly`
    - subscription/product ID مورد استفاده: `bd_pro_yearly`
13. Base planهای auto-renewing مربوط به ماهانه و سالانه را فعال کنید و قیمت/region را تنظیم کنید.
14. Trial هفت روزه را به عنوان offer در Play تنظیم کنید.
15. JSON کامل Service Account را در Google Store Account داخل Publisher وارد کنید.

## RevenueCat

1. یک Project به نام BE DIFFERENT بسازید.
2. یک Apple App با Bundle ID بالا و یک Google App با package بالا اضافه کنید.
3. credentialهای Store را طبق RevenueCat متصل کنید.
4. entitlement با شناسه `pro` بسازید.
5. محصولات ماهانه و سالانه Apple و Google را import و هر چهار product را به entitlement `pro` وصل کنید.
6. یک Current Offering بسازید و Monthly و Annual package را داخل آن بگذارید.
7. Public SDK key هر platform را برای Publisher build env بردارید.
8. Secret API key سمت سرور را برای GitHub Secret بردارید.
9. Webhook به آدرس backend تنظیم شود و Authorization برابر Bearer secret باشد.

## Expo / Push

1. یک project در expo.dev بسازید یا repo را با `eas init` به project متصل کنید.
2. UUID project را به عنوان `EXPO_PUBLIC_EAS_PROJECT_ID` بردارید.
3. اگر Enhanced Push Security را فعال کردید، Access Token را به عنوان `EXPO_PUSH_ACCESS_TOKEN` در GitHub Secrets قرار دهید.
4. credentialهای APNs/FCM مربوط به Expo project روی اکانت Expo تنظیم شوند تا Expo Push Token روی build واقعی کار کند.

## Publisher

بعد از ساخت App Recordهای Apple و Google:

- App: BE DIFFERENT
- Platform: Android + iOS
- Framework: React Native
- Repo: `https://github.com/hsdarestani/aymantraining`
- Branch: `main`
- Package: `com.smarbiz.bedifferent`
- Bundle ID: `com.smarbiz.bedifferent`

Build commands و signing در `docs/PUBLISHER_RELEASE.md` مشخص شده‌اند.
