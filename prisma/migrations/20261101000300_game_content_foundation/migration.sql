CREATE TYPE "ContentCategoryType" AS ENUM ('CHARACTER', 'QUESTION');

CREATE TABLE "GameContentCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "type" "ContentCategoryType" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameContentCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameCharacter" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "avatar" TEXT NOT NULL,
  "attributes" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameCharacter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameQuestion" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "labelAr" TEXT NOT NULL,
  "labelEn" TEXT NOT NULL,
  "attributeKey" TEXT NOT NULL,
  "expectedValue" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameContentCategory_slug_key" ON "GameContentCategory"("slug");
CREATE INDEX "GameContentCategory_type_isActive_sortOrder_idx" ON "GameContentCategory"("type", "isActive", "sortOrder");
CREATE INDEX "GameCharacter_categoryId_isActive_sortOrder_idx" ON "GameCharacter"("categoryId", "isActive", "sortOrder");
CREATE INDEX "GameQuestion_categoryId_isActive_sortOrder_idx" ON "GameQuestion"("categoryId", "isActive", "sortOrder");

ALTER TABLE "GameCharacter" ADD CONSTRAINT "GameCharacter_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "GameContentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "GameContentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
