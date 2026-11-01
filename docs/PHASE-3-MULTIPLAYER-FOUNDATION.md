# Phase 3 — Multiplayer Foundation & Game Engine

## Goal
Turn the Phase 2 local practice board into a secure two-player online game. PostgreSQL is authoritative; Ably is only the realtime delivery layer.

## Delivery sequence
1. Persistence foundation: room lifecycle, two player seats, private per-player game state, ordered action log, idempotency keys, and optimistic versioning.
2. Room lifecycle: authenticated create/join by invite code, capacity checks, room expiry, leave/reconnect handling, and readiness.
3. Server-authoritative game engine: start-round validation, secret character assignment, question validation/answering, private elimination state, guesses, turn transitions, timers, and win conditions.
4. Realtime delivery: issue short-lived Ably tokens only after verifying room membership; clients may subscribe to their room channel, while the server publishes validated public events.
5. Client integration: lobby, waiting room, online match screen, reconnect/resync, and localized error states.

## Data and security rules
- Room stores room lifecycle and authoritative version/turn metadata.
- RoomMember.secretCharacterId is private server state. It must never be included in room summaries, public events, or the other player's response.
- RoomMember.eliminatedCharacterIds is a private board state for that member. Never serialize another member's private list.
- GameAction is an ordered action log. Public event payloads contain only information both players may know.
- Every mutation authenticates the actor, verifies active membership and room status/turn, validates payload server-side, and runs in a database transaction.
- Use (roomId, actorId, idempotencyKey) to prevent duplicate actions on retries.
- Increment Room.version on every accepted state transition. Clients resync from PostgreSQL if they detect a version gap.
- Never expose ABLY_API_KEY to the browser. Authorize Ably token requests against current room membership; grant subscribe capability only. Server code publishes events after the database transaction commits.
- Realtime notifications are hints, not the source of truth. Reconnecting clients fetch a fresh authorized snapshot.

## Gameplay decisions intentionally deferred
The final turn sequence, whether a player may ask multiple questions, timer behavior, wrong-guess penalty, and tie/timeout rules will be specified with the user before implementing the complete online game flow. This avoids locking in assumptions from the local practice prototype.

## Phase 3 acceptance criteria
- Two distinct authenticated users can create and join a room.
- A room cannot accept a third player.
- Both users can ready up and start only when the room is valid.
- Each player selects one secret character; the opponent can never retrieve it.
- Questions and guesses are validated server-side and persisted exactly once.
- Public events are delivered to both authorized room members without leaking private state.
- Refresh/reconnect restores the correct room and each player's own private board.
- Unauthorized users cannot inspect or mutate rooms.
- Arabic RTL and English LTR remain supported.

## Out of scope
- Visual redesign of the play page (recorded for a later UI/UX pass).
- Admin dashboard, rankings, cosmetics, chat, monetization, and tournament features.
