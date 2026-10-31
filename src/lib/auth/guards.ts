import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(locale: "ar" | "en" = "ar") {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}
