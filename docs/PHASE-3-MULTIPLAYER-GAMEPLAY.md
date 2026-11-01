# Phase 3 — Multiplayer gameplay

## Implemented on main
- PostgreSQL is authoritative for rooms, player turns, eliminations, action history, and match results.
- Both players select their own secret character before the host starts the match.
- Every question is evaluated on the server against the opponent's secret character. Only the yes/no answer and public action metadata are returned.
- Each player's eliminated character IDs are stored on their own RoomMember record.
- Each player can ask each supported question once per match; only the active player can ask or guess.
- Incorrect guesses eliminate the selected character and pass the turn. A correct guess completes the match and records the winner.
- Authorized snapshots reveal only the requesting player's secret character and elimination list. The opponent's secret ID is never serialized.
- The game board and action history refresh from PostgreSQL every two seconds while the browser tab is visible. Reloading restores the current match.
- Stale player heartbeats are marked disconnected after 15 seconds; a returning member is marked connected again on the next snapshot request.
- Ably server publishing and scoped token issuance remain available, but browser-side Ably subscriptions are deferred because of the current Next.js bundling incompatibility.

## Required manual verification
1. Sign in with two distinct player accounts in separate browsers.
2. Create a room in browser A and join with its six-digit code in browser B.
3. Select different secret characters, mark both players ready, and start from the host.
4. Confirm only the active player can ask a question or guess.
5. Verify the answer matches the opponent's selected character and the asking player's board eliminates the correct cards.
6. Verify the turn changes on both browsers, repeated questions are rejected, incorrect guesses eliminate one card, and a correct guess ends the match with the right winner.
7. Reload one browser during the match and confirm its state is restored from PostgreSQL.
8. Close one browser for more than 15 seconds and confirm its connection state becomes disconnected; reopen it and confirm it reconnects.
9. Confirm neither player's secret character ID appears in the opponent's snapshot or public action payloads.

## Local migration
After pulling the latest main branch, run `npm run db:migrate` to apply the added indexes, then `npm run db:generate` and `npm run typecheck`.
