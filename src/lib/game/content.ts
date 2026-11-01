import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type GameCharacterRecord = {
  id: string;
  name: string;
  avatar: string;
  attributes: Record<string, string | boolean>;
};

export type GameQuestionRecord = {
  id: string;
  labelAr: string;
  labelEn: string;
  attributeKey: string;
  expectedValue: string | boolean;
  category: { slug: string; nameAr: string; nameEn: string };
  sortOrder: number;
};

function toAttributes(value: Prisma.JsonValue): Record<string, string | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string | boolean] =>
      typeof entry[1] === "string" || typeof entry[1] === "boolean"
    )
  );
}

export async function getActiveCharacters(): Promise<GameCharacterRecord[]> {
  const rows = await prisma.gameCharacter.findMany({
    where: { isActive: true, category: { isActive: true, type: "CHARACTER" } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true, avatar: true, attributes: true }
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    attributes: toAttributes(row.attributes)
  }));
}

export async function getActiveQuestions(): Promise<GameQuestionRecord[]> {
  const rows = await prisma.gameQuestion.findMany({
    where: { isActive: true, category: { isActive: true, type: "QUESTION" } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      labelAr: true,
      labelEn: true,
      attributeKey: true,
      expectedValue: true,
      sortOrder: true,
      category: { select: { slug: true, nameAr: true, nameEn: true } }
    }
  });

  return rows.flatMap((row) => {
    const expectedValue = row.expectedValue;
    if (typeof expectedValue !== "string" && typeof expectedValue !== "boolean") return [];
    return [{ ...row, expectedValue }];
  });
}

export function evaluateQuestion(
  character: GameCharacterRecord,
  question: Pick<GameQuestionRecord, "attributeKey" | "expectedValue">
): boolean {
  return character.attributes[question.attributeKey] === question.expectedValue;
}

export async function getActiveCharacterById(id: string) {
  return prisma.gameCharacter.findFirst({
    where: {
      id,
      isActive: true,
      category: { isActive: true, type: "CHARACTER" }
    },
    select: { id: true }
  });
}

export async function getActiveQuestionById(id: string) {
  const question = await prisma.gameQuestion.findFirst({
    where: {
      id,
      isActive: true,
      category: { isActive: true, type: "QUESTION" }
    },
    select: {
      id: true,
      attributeKey: true,
      expectedValue: true
    }
  });
  if (!question) return null;
  if (typeof question.expectedValue !== "string" && typeof question.expectedValue !== "boolean") return null;
  return { ...question, expectedValue: question.expectedValue };
}
