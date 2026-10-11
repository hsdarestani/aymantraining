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
import "./brand-system.css";
import "./form-layout.css";
import "./web-athlete-2026.css";
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
  viewportFit: "cover",
  themeColor: "#050606"
};

export default async function RootLayout({children}:{children:React.ReactNode}) {
  const preferred=(await cookies()).get("bd_locale")?.value;
  const user=await getCurrentUser();
  const locale=language(preferred??user?.locale);
  const demo=user?.email==="admin@bedifferent.smarbiz.sbs" && user?.name==="Ayman";
  return <html lang={locale}><body><LocaleProvider initialLocale={locale}><ServiceWorker/>{demo&&<div role="status" style={{background:"#263014",color:"#dbff73",textAlign:"center",padding:"7px 12px",fontSize:11,fontWeight:800,letterSpacing:".04em",borderBottom:"1px solid #4a5d27"}}>DEMO ANSICHT · Beispieldaten, keine bestätigten persönlichen Messwerte oder echten Geräteverbindungen</div>}{children}</LocaleProvider></body></html>;
}
