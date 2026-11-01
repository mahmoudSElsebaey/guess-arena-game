import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { characters } from "../src/data/characters";
import { gameQuestionSeeds } from "../src/data/questions";

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


async function seedGameContent() {
  const categories = [
    { id: "content-category-classic-characters", slug: "classic-characters", nameAr: "الشخصيات الكلاسيكية", nameEn: "Classic characters", type: "CHARACTER" as const, sortOrder: 1 },
    { id: "content-category-appearance", slug: "appearance", nameAr: "المظهر", nameEn: "Appearance", type: "QUESTION" as const, sortOrder: 1 },
    { id: "content-category-accessories", slug: "accessories", nameAr: "الإكسسوارات", nameEn: "Accessories", type: "QUESTION" as const, sortOrder: 2 },
    { id: "content-category-identity", slug: "identity", nameAr: "الصفات الشخصية", nameEn: "Identity", type: "QUESTION" as const, sortOrder: 3 }
  ];

  for (const category of categories) {
    await prisma.gameContentCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        type: category.type,
        sortOrder: category.sortOrder
      }
    });
  }

  const characterCategory = await prisma.gameContentCategory.findUniqueOrThrow({
    where: { slug: "classic-characters" }
  });

  for (const [index, character] of characters.entries()) {
    const { id, name, avatar, ...attributes } = character;
    await prisma.gameCharacter.upsert({
      where: { id },
      create: {
        id,
        categoryId: characterCategory.id,
        name,
        avatar,
        attributes,
        sortOrder: index + 1,
        isActive: true
      },
      update: {
        categoryId: characterCategory.id,
        name,
        avatar,
        attributes,
        sortOrder: index + 1
      }
    });
  }

  const questionCategories = await prisma.gameContentCategory.findMany({
    where: { slug: { in: ["appearance", "accessories", "identity"] } },
    select: { id: true, slug: true }
  });
  const categoryIds = new Map(questionCategories.map(category => [category.slug, category.id]));

  for (const question of gameQuestionSeeds) {
    const categoryId = categoryIds.get(question.categorySlug);
    if (!categoryId) throw new Error(`Missing question category: ${question.categorySlug}`);

    await prisma.gameQuestion.upsert({
      where: { id: question.id },
      create: {
        id: question.id,
        categoryId,
        labelAr: question.labelAr,
        labelEn: question.labelEn,
        attributeKey: question.attributeKey,
        expectedValue: question.expectedValue,
        sortOrder: question.sortOrder,
        isActive: true
      },
      update: {
        categoryId,
        labelAr: question.labelAr,
        labelEn: question.labelEn,
        attributeKey: question.attributeKey,
        expectedValue: question.expectedValue,
        sortOrder: question.sortOrder
      }
    });
  }
}

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {}
  });

  await seedGameContent();

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
