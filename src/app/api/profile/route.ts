import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(32),
  email: z.string().trim().email().max(254).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(64).optional()
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, image: true, role: true, isGuest: true, createdAt: true } });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(user, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, passwordHash: true, isGuest: true } });
  if (!current) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  const data = parsed.data;
  if (data.newPassword && (!data.currentPassword || !current.passwordHash || !(await compare(data.currentPassword, current.passwordHash)))) {
    return NextResponse.json({ error: "CURRENT_PASSWORD_INVALID" }, { status: 400 });
  }
  const email = current.isGuest ? undefined : data.email?.toLowerCase();
  if (email) {
    const exists = await prisma.user.findFirst({ where: { email, id: { not: current.id } }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }
  const user = await prisma.user.update({
    where: { id: current.id },
    data: {
      name: data.name,
      ...(email ? { email } : {}),
      ...(data.newPassword ? { passwordHash: await hash(data.newPassword, 12) } : {})
    },
    select: { id: true, name: true, email: true, image: true, role: true, isGuest: true }
  });
  return NextResponse.json({ ok: true, user });
}
