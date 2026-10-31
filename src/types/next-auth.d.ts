import type { DefaultSession } from "next-auth";

type AppRole = "PLAYER" | "ADMIN" | "OWNER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      isGuest: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
    isGuest?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    isGuest?: boolean;
  }
}
