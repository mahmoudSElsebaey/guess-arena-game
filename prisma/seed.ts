import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type DemoAccount = {
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
};

async function seedDemoAccount(account: DemoAccount) {
  if (!account.email || !account.password) return;
  if (account.password.length < 12) {
    throw new Error(`Demo password for ${account.role} must contain at least 12 characters.`);
  }

  const email = account.email.trim().toLowerCase();
  const passwordHash = await hash(account.password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      name: account.name,
      email,
      passwordHash,
      role: account.role,
      status: "ACTIVE",
      isGuest: false
    },
    update: {
      name: account.name,
      passwordHash,
      role: account.role,
      status: "ACTIVE",
      isGuest: false
    }
  });
}

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {}
  });

  if (process.env.DEMO_ACCOUNTS_ENABLED !== "true") return;

  const accounts: DemoAccount[] = [
    { name: "Game Owner", email: process.env.DEMO_OWNER_EMAIL ?? process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL, password: process.env.DEMO_OWNER_PASSWORD ?? process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD, role: "OWNER" },
    { name: "Game Admin", email: process.env.DEMO_ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL, password: process.env.DEMO_ADMIN_PASSWORD ?? process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD, role: "ADMIN" },
    { name: "Player 1", email: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_EMAIL, password: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_PASSWORD, role: "PLAYER" },
    { name: "Player 2", email: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_EMAIL, password: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_PASSWORD, role: "PLAYER" }
  ];

  for (const account of accounts) await seedDemoAccount(account);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Database seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
