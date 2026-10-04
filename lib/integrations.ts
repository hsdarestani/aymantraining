export function integrationStatus(){
  const firebase=Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_B64||(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&process.env.FIREBASE_PRIVATE_KEY));
  const appleBilling=Boolean(process.env.APPLE_IAP_ISSUER_ID&&process.env.APPLE_IAP_KEY_ID&&process.env.APPLE_IAP_PRIVATE_KEY_B64);
  const googleBilling=Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_B64);
  return {
    firebase,
    push:firebase,
    storage:true,
    appleBilling,
    googleBilling,
    storeBilling:appleBilling&&googleBilling,
    email:Boolean(process.env.SMTP_HOST&&process.env.SMTP_PORT&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.EMAIL_FROM),
    posthog:Boolean(process.env.POSTHOG_KEY),
    sentry:Boolean(process.env.SENTRY_DSN)
  };
}
