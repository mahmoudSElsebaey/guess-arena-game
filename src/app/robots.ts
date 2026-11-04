import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/ar", "/en", "/ar/about", "/en/about", "/ar/how-to-play", "/en/how-to-play", "/ar/play", "/en/play"],
      disallow: ["/api/", "/*/admin", "/*/admin/", "/*/profile", "/*/history", "/*/login", "/*/register", "/*/practice", "/*/play/create", "/*/play/join", "/*/play/room/"]
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
