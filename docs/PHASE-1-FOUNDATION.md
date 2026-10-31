# Phase 1 — Foundation

## Scope

This phase establishes the application shell and core infrastructure without implementing multiplayer gameplay.

## Decisions

- Next.js App Router + React + strict TypeScript.
- PostgreSQL with Prisma ORM.
- Auth.js with database-backed sessions and Prisma adapter.
- Ably is reserved for authorized realtime transport; its API key is server-only.
- Cloudinary is reserved for character media management.
- Arabic-first interface foundation, with English localization to be completed in this phase.
- Guest access is a configurable product setting; the initial default is enabled.

## Security boundaries

- Never return secret character IDs or private board state in public room payloads.
- The database is authoritative; realtime events are notifications, not trusted commands.
- All privileged actions must be authorized on the server.
- Keep database and Ably credentials out of client bundles.

## Completion checklist

- [x] Initial Next.js project scaffold
- [x] Strict TypeScript configuration
- [x] PostgreSQL Prisma datasource and Auth.js models
- [x] Prisma singleton for development hot reload
- [x] Auth.js route handler foundation
- [x] Environment variable template
- [x] CI workflow foundation
- [ ] Arabic/English locale routing and RTL/LTR
- [ ] Complete game-domain Prisma schema
- [ ] Database migration and safe seed strategy
- [ ] Ably token-auth endpoint and private channel authorization
- [ ] Guest-mode setting persisted and enforced server-side
- [ ] Run install, typecheck, lint, and production build successfully

## Notes

No production database credentials are committed. No production migration or destructive database operation is run by this phase.
