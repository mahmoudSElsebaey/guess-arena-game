# Phase 3 — Multiplayer Foundation & Game Engine

## Implemented
- Authenticated room creation with unique six-digit invite codes and a 30-minute waiting-room expiry.
- Join by invite code, two-seat capacity, reconnecting an existing membership, and leave handling.
- Private room snapshots: each player receives only their own secret character ID; opponent state exposes only whether a character was selected.
- Ready/unready requires a valid character ID.
- Host-only match start requires exactly two active members, both ready and both with a selected secret character.
- Ordered room action records and room version increments.
- Ably token requests verify active membership and grant subscribe-only capability for that room. Public realtime events contain room status/version only.

## Architecture and security
PostgreSQL is the source of truth. Ably events are hints; clients refetch an authorized snapshot after receiving an event. Never serialize secretCharacterId or eliminatedCharacterIds for another member. All mutations require an authenticated active member and validate room status/host permissions.

## Next
Server-authoritative question/answer/guess actions, turn transitions, timers, reconnect resync for gameplay, and client-side online match board. Visual redesign of the practice play page remains deferred.
