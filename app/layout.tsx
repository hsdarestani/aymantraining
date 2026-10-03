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
import ServiceWorker from "./ServiceWorker";

export const metadata: Metadata = {
  title: "BE DIFFERENT",
  description: "Build Your Athlete — coaching, performance and recovery in one system."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050606"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de"><body><ServiceWorker/>{children}</body></html>;
}
