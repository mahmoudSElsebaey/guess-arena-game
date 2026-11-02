# Guess Arena

A bilingual, real-time multiplayer character-guessing game built with Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, and Ably.

## Current status
Phases 1–6 are implemented, and Phase 6 has been manually tested. Phase 9 (Final UX) is now implemented on `main`: authentication and demo-account guidance, clearer room/match recovery states, admin reload actions, and corrected bilingual landing-page copy. Phases 7, 8, and 10 remain separate planned work and are intentionally outside the current scope.

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
