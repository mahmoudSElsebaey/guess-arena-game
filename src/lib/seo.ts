import type { Metadata } from "next";

const SITE_URL = "https://guess-arena-game.vercel.app";
const SITE_NAME = "Guess Arena";

type LocalizedSeoInput = {
  locale: "ar" | "en";
  path: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  indexable?: boolean;
  keywords?: string[];
};

export function localizedPageMetadata({
  locale, path, titleAr, titleEn, descriptionAr, descriptionEn, indexable = true, keywords = []
}: LocalizedSeoInput): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? titleAr : titleEn;
  const description = isArabic ? descriptionAr : descriptionEn;
  const canonical = `/${locale}${path}`;
  const image = `/${locale}/opengraph-image`;

  return {
    title, description, keywords,
    alternates: {
      canonical,
      languages: { ar: `/ar${path}`, en: `/en${path}`, "x-default": `/ar${path}` }
    },
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
    openGraph: {
      type: "website", siteName: SITE_NAME, title, description, url: canonical,
      locale: isArabic ? "ar_EG" : "en_US",
      alternateLocale: isArabic ? ["en_US"] : ["ar_EG"],
      images: [{ url: image, width: 1200, height: 630, alt: isArabic ? "Guess Arena - لعبة تخمين الشخصيات" : "Guess Arena - character guessing game" }]
    },
    twitter: { card: "summary_large_image", title, description, images: [image] }
  };
}

export { SITE_URL, SITE_NAME };
