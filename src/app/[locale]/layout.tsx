import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PublicFooter } from "@/components/layout/public-footer";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://guess-arena-game.vercel.app"),
  applicationName: "Guess Arena",
  title: {
    default: "Guess Arena | لعبة تخمين الشخصيات أونلاين",
    template: "%s | Guess Arena"
  },
  description: "العب Guess Arena، لعبة تخمين الشخصيات أونلاين. تحدى أصدقاءك في مباراة مباشرة أو اختبر ذكاءك ضد البوت.",
  category: "games",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"]
  },
  openGraph: {
    type: "website",
    siteName: "Guess Arena",
    title: "Guess Arena | Online Character Guessing Game",
    description: "Challenge a friend in a live character guessing duel or play against the bot.",
    images: [{ url: "/ar/opengraph-image", width: 1200, height: 630, alt: "Guess Arena character guessing game" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess Arena | Online Character Guessing Game",
    description: "Challenge a friend or play against the bot.",
    images: ["/ar/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  }
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}<PublicFooter /></AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
