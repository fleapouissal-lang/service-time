import type { Metadata } from "next";
import { Poppins, Tajawal } from "next/font/google";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicShell } from "@/components/layout/public-shell";
import { SparePartsCartRoot } from "@/components/spare-parts/spare-parts-cart-root";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Fallback web jusqu'à ajout des fichiers Janna LT dans public/fonts/ */
const jannaFallback = Tajawal({
  variable: "--font-janna-fallback",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Service Time | صيانة السيارات في الرياض",
    template: "%s | Service Time",
  },
  description:
    "منصة Service Time لصيانة السيارات وقطع الغيار في الرياض — طلب خدمة، تتبع مباشر، ورشة ثابتة أو متنقلة.",
  icons: {
    icon: "/logos/icon.png",
    shortcut: "/logos/icon.png",
    apple: "/logos/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${poppins.variable} ${jannaFallback.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <SparePartsCartRoot>
          <PublicShell header={<SiteHeader />} footer={<SiteFooter />}>
            {children}
          </PublicShell>
        </SparePartsCartRoot>
      </body>
    </html>
  );
}
