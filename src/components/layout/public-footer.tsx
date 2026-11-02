"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteFooter } from "@/components/layout/site-footer";

export function PublicFooter() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/play") || pathname === "/practice" || pathname.startsWith("/admin");
  return hidden ? null : <SiteFooter />;
}
