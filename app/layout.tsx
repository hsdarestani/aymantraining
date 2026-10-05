import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./product.css";
import "./admin-extra.css";
import "./pricing.css";
import "./engagement.css";
import "./onboarding-extra.css";
import "./auth.css";
import "./member-extra.css";
import "./admin-extra2.css";
import "./admin-builder.css";
import "./pro-extra.css";
import "./feature-extra.css";
import "./design-2026.css";
import "./admin-settings.css";
import "./onboarding-ux.css";
import "./mobile-viewport-fix.css";
import "./completion.css";
import {cookies} from "next/headers";
import {LocaleProvider} from "./components/Locale";
import {getCurrentUser} from "../lib/auth";
import {language} from "../lib/i18n/translate";
import ServiceWorker from "./ServiceWorker";

export const metadata: Metadata = {
  title: "BE DIFFERENT",
  description: "Training, Leistung und Regeneration in einem persönlichen System.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050606"
};

export default async function RootLayout({children}:{children:React.ReactNode}) {
  const preferred=(await cookies()).get("bd_locale")?.value;
  const locale=language(preferred??(await getCurrentUser())?.locale);
  return <html lang={locale}><body><LocaleProvider initialLocale={locale}><ServiceWorker/>{children}</LocaleProvider></body></html>;
}
