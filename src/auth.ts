import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

const credentialsSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  mode: z.enum(["password", "guest"]).optional()
});

type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "PLAYER" | "ADMIN" | "OWNER";
  isGuest: boolean;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mode: { label: "Mode", type: "text" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        if (parsed.data.mode === "guest") {
          const settings = await getSiteSettings();
          if (!settings.allowGuestAccess) return null;

          const guestName = `Guest ${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
          const guest = await prisma.user.create({
            data: { name: guestName, isGuest: true }
          });

          return {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            image: guest.image,
            role: guest.role,
            isGuest: guest.isGuest
          } satisfies AuthUser;
        }

        const { email, password } = parsed.data;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (!user?.passwordHash || user.status !== "ACTIVE") return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isGuest: user.isGuest
        } satisfies AuthUser;
      }
    })
  ],
  pages: { signIn: "/ar/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & Partial<AuthUser>;
        token.role = authUser.role ?? "PLAYER";
        token.isGuest = authUser.isGuest ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role =
          token.role === "OWNER" ? "OWNER" : token.role === "ADMIN" ? "ADMIN" : "PLAYER";
        session.user.isGuest = token.isGuest === true;
      }
      return session;
    }
  }
});
