CREATE INDEX IF NOT EXISTS "GameAction_roomId_actorId_type_idx" ON "GameAction"("roomId", "actorId", "type");
CREATE INDEX IF NOT EXISTS "Room_currentTurnUserId_status_idx" ON "Room"("currentTurnUserId", "status");
