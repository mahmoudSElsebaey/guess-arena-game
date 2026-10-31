import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PLAYER" | "ADMIN";
      isGuest: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "PLAYER" | "ADMIN";
    isGuest?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "PLAYER" | "ADMIN";
    isGuest?: boolean;
  }
}
