import { prisma } from "@/lib/prisma";

export function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {}
  });
}
