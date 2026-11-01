CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "GameActionType" AS ENUM ('PLAYER_READY', 'GAME_STARTED', 'QUESTION_ASKED', 'GUESS_MADE', 'PLAYER_LEFT', 'GAME_FINISHED');
CREATE TABLE "Room" (
 "id" TEXT NOT NULL, "code" TEXT NOT NULL, "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
 "hostId" TEXT NOT NULL, "winnerId" TEXT, "currentTurnUserId" TEXT, "turnNumber" INTEGER NOT NULL DEFAULT 0,
 "version" INTEGER NOT NULL DEFAULT 0, "maxPlayers" INTEGER NOT NULL DEFAULT 2, "expiresAt" TIMESTAMP(3),
 "turnExpiresAt" TIMESTAMP(3), "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RoomMember" (
 "id" TEXT NOT NULL, "roomId" TEXT NOT NULL, "userId" TEXT NOT NULL, "seat" INTEGER NOT NULL,
 "isReady" BOOLEAN NOT NULL DEFAULT false, "isConnected" BOOLEAN NOT NULL DEFAULT true,
 "secretCharacterId" TEXT, "eliminatedCharacterIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "leftAt" TIMESTAMP(3), CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GameAction" (
 "id" TEXT NOT NULL, "roomId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "sequence" INTEGER NOT NULL,
 "type" "GameActionType" NOT NULL, "idempotencyKey" TEXT NOT NULL, "payload" JSONB NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GameAction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");
CREATE INDEX "Room_status_expiresAt_idx" ON "Room"("status", "expiresAt");
CREATE INDEX "Room_hostId_createdAt_idx" ON "Room"("hostId", "createdAt");
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");
CREATE UNIQUE INDEX "RoomMember_roomId_seat_key" ON "RoomMember"("roomId", "seat");
CREATE INDEX "RoomMember_userId_isConnected_idx" ON "RoomMember"("userId", "isConnected");
CREATE UNIQUE INDEX "GameAction_roomId_sequence_key" ON "GameAction"("roomId", "sequence");
CREATE UNIQUE INDEX "GameAction_roomId_actorId_idempotencyKey_key" ON "GameAction"("roomId", "actorId", "idempotencyKey");
CREATE INDEX "GameAction_roomId_createdAt_idx" ON "GameAction"("roomId", "createdAt");
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
