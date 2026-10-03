import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BE DIFFERENT",
  description: "Build Your Athlete — coaching, performance and recovery in one system."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de"><body>{children}</body></html>;
}
