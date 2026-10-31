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
  if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}
