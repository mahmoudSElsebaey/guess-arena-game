import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const attributeSchema = z.object({
  skin: z.enum(["light", "medium", "dark"]),
  hairColor: z.enum(["black", "brown", "blonde", "red", "gray"]),
  hairLength: z.enum(["short", "long", "none"]),
  hasHat: z.boolean(),
  hasGlasses: z.boolean(),
  hasBeard: z.boolean(),
  gender: z.enum(["male", "female"]),
  eyeColor: z.enum(["brown", "blue", "green"])
}).strict();

const categorySchema = z.object({
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameAr: z.string().trim().min(2).max(60),
  nameEn: z.string().trim().min(2).max(60),
  type: z.enum(["CHARACTER", "QUESTION"]),
  sortOrder: z.number().int().min(0).max(9999).default(0)
});

const characterSchema = z.object({
  categoryId: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(50),
  avatar: z.string().trim().min(1).max(16),
  attributes: attributeSchema,
  sortOrder: z.number().int().min(0).max(9999).default(0)
});

const questionSchema = z.object({
  categoryId: z.string().min(1).max(40),
  labelAr: z.string().trim().min(3).max(140),
  labelEn: z.string().trim().min(3).max(140),
  attributeKey: z.enum(["skin", "hairColor", "hairLength", "hasHat", "hasGlasses", "hasBeard", "gender", "eyeColor"]),
  expectedValue: z.union([z.string(), z.boolean()]),
  sortOrder: z.number().int().min(0).max(9999).default(0)
});

function failure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { response: failure("UNAUTHORIZED", 401) } as const;
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { response: failure("FORBIDDEN", 403) } as const;
  }
  return { userId: session.user.id } as const;
}

async function ensureNoActiveGames() {
  const activeGames = await prisma.room.count({ where: { status: "IN_PROGRESS" } });
  return activeGames === 0;
}

async function validateQuestionValue(attributeKey: string, expectedValue: string | boolean) {
  const allowed: Record<string, Array<string | boolean>> = {
    skin: ["light", "medium", "dark"],
    hairColor: ["black", "brown", "blonde", "red", "gray"],
    hairLength: ["short", "long", "none"],
    hasHat: [true, false],
    hasGlasses: [true, false],
    hasBeard: [true, false],
    gender: ["male", "female"],
    eyeColor: ["brown", "blue", "green"]
  };
  return allowed[attributeKey]?.includes(expectedValue) ?? false;
}

export async function GET() {
  const access = await requireAdmin();
  if ("response" in access) return access.response;

  const [categories, characters, questions, activeGames] = await Promise.all([
    prisma.gameContentCategory.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { nameEn: "asc" }],
      include: { _count: { select: { characters: true, questions: true } } }
    }),
    prisma.gameCharacter.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, slug: true, nameAr: true, nameEn: true } } }
    }),
    prisma.gameQuestion.findMany({
      orderBy: [{ sortOrder: "asc" }, { labelEn: "asc" }],
      include: { category: { select: { id: true, slug: true, nameAr: true, nameEn: true } } }
    }),
    prisma.room.count({ where: { status: "IN_PROGRESS" } })
  ]);

  return NextResponse.json({ categories, characters, questions, activeGames }, {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if ("response" in access) return access.response;
  if (!(await ensureNoActiveGames())) return failure("ACTIVE_GAMES_RUNNING", 409);

  try {
    const body = await request.json() as { resource?: string; data?: unknown };
    if (body.resource === "category") {
      const parsed = categorySchema.safeParse(body.data);
      if (!parsed.success) return failure("INVALID_CATEGORY");
      const category = await prisma.gameContentCategory.create({ data: parsed.data });
      return NextResponse.json({ category }, { status: 201 });
    }

    if (body.resource === "character") {
      const parsed = characterSchema.safeParse(body.data);
      if (!parsed.success) return failure("INVALID_CHARACTER");
      const category = await prisma.gameContentCategory.findFirst({
        where: { id: parsed.data.categoryId, type: "CHARACTER", isActive: true },
        select: { id: true }
      });
      if (!category) return failure("INVALID_CHARACTER_CATEGORY");
      const character = await prisma.gameCharacter.create({
        data: {
          id: `character-${randomUUID().slice(0, 12)}`,
          ...parsed.data,
          attributes: parsed.data.attributes as Prisma.InputJsonValue
        }
      });
      return NextResponse.json({ character }, { status: 201 });
    }

    if (body.resource === "question") {
      const parsed = questionSchema.safeParse(body.data);
      if (!parsed.success) return failure("INVALID_QUESTION");
      if (!(await validateQuestionValue(parsed.data.attributeKey, parsed.data.expectedValue))) {
        return failure("INVALID_EXPECTED_VALUE");
      }
      const category = await prisma.gameContentCategory.findFirst({
        where: { id: parsed.data.categoryId, type: "QUESTION", isActive: true },
        select: { id: true }
      });
      if (!category) return failure("INVALID_QUESTION_CATEGORY");
      const question = await prisma.gameQuestion.create({
        data: {
          id: `question-${randomUUID().slice(0, 12)}`,
          ...parsed.data,
          expectedValue: parsed.data.expectedValue as Prisma.InputJsonValue
        }
      });
      return NextResponse.json({ question }, { status: 201 });
    }

    return failure("INVALID_RESOURCE");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failure("DUPLICATE_VALUE", 409);
    }
    console.error("Admin content create failed:", error);
    return failure("CONTENT_SAVE_FAILED", 500);
  }
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if ("response" in access) return access.response;
  if (!(await ensureNoActiveGames())) return failure("ACTIVE_GAMES_RUNNING", 409);

  try {
    const body = await request.json() as { resource?: string; id?: string; data?: unknown };
    if (!body.id || body.id.length > 80) return failure("INVALID_ID");

    if (body.resource === "category") {
      const parsed = categorySchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(body.data);
      if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return failure("INVALID_CATEGORY");
      const current = await prisma.gameContentCategory.findUnique({ where: { id: body.id } });
      if (!current) return failure("NOT_FOUND", 404);
      if (parsed.data.type && parsed.data.type !== current.type) return failure("CATEGORY_TYPE_LOCKED");
      if (parsed.data.isActive === false) {
        const activeChildren = await prisma.gameContentCategory.findUnique({
          where: { id: body.id },
          select: { characters: { where: { isActive: true }, select: { id: true }, take: 1 }, questions: { where: { isActive: true }, select: { id: true }, take: 1 } }
        });
        if (activeChildren?.characters.length || activeChildren?.questions.length) return failure("CATEGORY_HAS_ACTIVE_CONTENT", 409);
      }
      const category = await prisma.gameContentCategory.update({ where: { id: body.id }, data: parsed.data });
      return NextResponse.json({ category });
    }

    if (body.resource === "character") {
      const parsed = characterSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(body.data);
      if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return failure("INVALID_CHARACTER");
      const current = await prisma.gameCharacter.findUnique({ where: { id: body.id } });
      if (!current) return failure("NOT_FOUND", 404);
      if (parsed.data.categoryId) {
        const category = await prisma.gameContentCategory.findFirst({
          where: { id: parsed.data.categoryId, type: "CHARACTER", isActive: true },
          select: { id: true }
        });
        if (!category) return failure("INVALID_CHARACTER_CATEGORY");
      }
      const character = await prisma.gameCharacter.update({
        where: { id: body.id },
        data: {
          ...parsed.data,
          ...(parsed.data.attributes ? { attributes: parsed.data.attributes as Prisma.InputJsonValue } : {})
        }
      });
      return NextResponse.json({ character });
    }

    if (body.resource === "question") {
      const parsed = questionSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(body.data);
      if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return failure("INVALID_QUESTION");
      const current = await prisma.gameQuestion.findUnique({ where: { id: body.id } });
      if (!current) return failure("NOT_FOUND", 404);
      const attributeKey = parsed.data.attributeKey ?? current.attributeKey;
      const expectedValue = parsed.data.expectedValue ?? current.expectedValue;
      if (typeof expectedValue !== "string" && typeof expectedValue !== "boolean") return failure("INVALID_EXPECTED_VALUE");
      if (!(await validateQuestionValue(attributeKey, expectedValue))) return failure("INVALID_EXPECTED_VALUE");
      if (parsed.data.categoryId) {
        const category = await prisma.gameContentCategory.findFirst({
          where: { id: parsed.data.categoryId, type: "QUESTION", isActive: true },
          select: { id: true }
        });
        if (!category) return failure("INVALID_QUESTION_CATEGORY");
      }
      const question = await prisma.gameQuestion.update({
        where: { id: body.id },
        data: { ...parsed.data, expectedValue: expectedValue as Prisma.InputJsonValue }
      });
      return NextResponse.json({ question });
    }

    return failure("INVALID_RESOURCE");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failure("DUPLICATE_VALUE", 409);
    }
    console.error("Admin content update failed:", error);
    return failure("CONTENT_SAVE_FAILED", 500);
  }
}

export async function DELETE(request: Request) {
  const access = await requireAdmin();
  if ("response" in access) return access.response;
  if (!(await ensureNoActiveGames())) return failure("ACTIVE_GAMES_RUNNING", 409);

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");
  const id = url.searchParams.get("id");
  if (resource !== "category" || !id) {
    return failure("CONTENT_ARCHIVE_ONLY", 400);
  }

  const category = await prisma.gameContentCategory.findUnique({
    where: { id },
    include: { _count: { select: { characters: true, questions: true } } }
  });
  if (!category) return failure("NOT_FOUND", 404);
  if (category._count.characters > 0 || category._count.questions > 0) {
    return failure("CATEGORY_NOT_EMPTY", 409);
  }

  await prisma.gameContentCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
