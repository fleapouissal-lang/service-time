import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { AuthSessionGuard } from "@/components/auth/auth-session-guard";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicShell } from "@/components/layout/public-shell";
import { SparePartsCartRoot } from "@/components/spare-parts/spare-parts-cart-root";
import { getDir } from "@/lib/i18n/config";
import { getServerI18n } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getTheme } from "@/lib/theme/get-theme";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { buildSiteMetadata } from "@/lib/seo";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#94D4B9" },
    { media: "(prefers-color-scheme: dark)", color: "#94D4B9" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildSiteMetadata({
    locale,
    siteTitle: t.meta.siteTitle,
    siteDescription: t.meta.siteDescription,
    keywords: t.meta.keywords.split(",").map((k) => k.trim()),
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getServerI18n();
  const dir = getDir(locale);
  const theme = await getTheme();
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${poppins.variable} ${theme} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <PwaProvider>
          <LocaleProvider locale={locale}>
            <ThemeProvider initialTheme={theme}>
              <AuthSessionGuard />
              <SparePartsCartRoot>
                <PublicShell header={<SiteHeader />} footer={<SiteFooter />}>
                  {children}
                </PublicShell>
                <MobileBottomNav />
              </SparePartsCartRoot>
            </ThemeProvider>
          </LocaleProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
