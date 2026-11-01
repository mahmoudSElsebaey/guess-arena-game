# Admin Room Operations

## Access
Only active OWNER and ADMIN accounts can access the room management page and API.

## Page
- Arabic: `/[locale]/admin/rooms` (for example `/ar/admin/rooms`)
- API: `GET /api/admin/rooms`

The page shows the latest 100 rooms, status counts, host, player names/emails, connection state, creation/start time, and recorded action count.

## Administrative termination
`PATCH /api/admin/rooms` with `{ "roomId": "...", "action": "terminate" }` terminates a WAITING or IN_PROGRESS room.

The operation:
- Changes the room status to CANCELLED.
- Clears the current turn and winner.
- Marks active room memberships as left and disconnected.
- Records a GAME_FINISHED action with reason ADMIN_TERMINATED.
- Publishes a room update event.
- Uses a serializable transaction and room version check to avoid overwriting concurrent game actions.

Termination is final. It does not delete room or action history.

## Content editing
Once all IN_PROGRESS rooms are completed or administratively terminated, the content studio's existing active-game guard permits content changes again.
