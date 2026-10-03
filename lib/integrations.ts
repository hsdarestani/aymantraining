export function integrationStatus(){
  return {
    firebase:Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_B64||(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&process.env.FIREBASE_PRIVATE_KEY)),
    r2:Boolean(process.env.R2_ACCOUNT_ID&&process.env.R2_ACCESS_KEY_ID&&process.env.R2_SECRET_ACCESS_KEY&&process.env.R2_BUCKET),
    revenuecat:Boolean(process.env.REVENUECAT_WEBHOOK_SECRET),
    email:Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),
    posthog:Boolean(process.env.POSTHOG_KEY),
    sentry:Boolean(process.env.SENTRY_DSN)
  };
}
