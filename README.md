# Guess Arena

A bilingual, real-time multiplayer character-guessing game built with Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, and Ably.

## Current status
Phase 1 and Phase 2 are complete. Phase 3 now includes authenticated room creation/joining, private character selection, player readiness, host-only start validation, and room-scoped Ably token authorization. Server-authoritative question/guess gameplay follows next.

## Requirements
- Node.js 20.9+, npm, PostgreSQL 14+, Ably API key for realtime.

## Setup
1. npm install
2. Copy .env.example to .env.local and configure DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, and ABLY_API_KEY.
3. npm run db:validate && npm run db:generate
4. npm run db:migrate && npm run db:seed
5. npm run dev

## Security
PostgreSQL is authoritative. Ably transports public room version/status events only. Secret character IDs and private elimination lists are never returned in room snapshots for other members. The realtime token endpoint verifies active membership and grants subscribe-only capability. Never expose ABLY_API_KEY to the browser.

## Quality
npm run typecheck, npm run lint, npm run test:run, npm run build.
