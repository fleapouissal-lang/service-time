import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthSessionGuard } from "@/components/auth/auth-session-guard";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicShell } from "@/components/layout/public-shell";
import { SparePartsCartRoot } from "@/components/spare-parts/spare-parts-cart-root";
import { getDir } from "@/lib/i18n/config";
import { getServerI18n } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    title: {
      default: t.meta.siteTitle,
      template: "%s | Service Time",
    },
    description: t.meta.siteDescription,
    icons: {
      icon: "/logos/icon.png",
      shortcut: "/logos/icon.png",
      apple: "/logos/icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getServerI18n();
  const dir = getDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${poppins.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <LocaleProvider locale={locale}>
          <AuthSessionGuard />
          <SparePartsCartRoot>
            <PublicShell header={<SiteHeader />} footer={<SiteFooter />}>
              {children}
            </PublicShell>
          </SparePartsCartRoot>
        </LocaleProvider>
      </body>
    </html>
  );
}
