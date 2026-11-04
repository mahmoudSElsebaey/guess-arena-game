import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const locales = ["ar", "en"] as const;
const publicPaths = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/how-to-play", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/play", priority: 0.9, changeFrequency: "weekly" as const }
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: { ar: `${SITE_URL}/ar${path}`, en: `${SITE_URL}/en${path}` } }
    }))
  );
}
