# Guess Arena

A bilingual, real-time multiplayer character-guessing game built with Next.js, TypeScript, PostgreSQL, Prisma, and Ably.

## Project status

Phase 1 — Foundation is in progress. The initial repository scaffold is being established; game features are not implemented yet.

## Requirements

- Node.js 20.9+
- npm
- PostgreSQL database
- Ably account and API key
- Auth.js secret

## Getting started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the required values.
3. Generate the Prisma client: `npx prisma generate`
4. Apply migrations locally: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

Open http://localhost:3000.

## Environment variables

See `.env.example`. Never commit real credentials.

## Architecture principles

- PostgreSQL is the source of truth for users, rooms, rounds, turns, and results.
- Prisma owns the database schema and migrations.
- Ably transports authorized real-time events; it is not the game-state database.
- All game commands and secret-character access must be validated server-side.
- Secret characters and per-player elimination boards must never be included in public room payloads.
- Arabic is the default locale (RTL); English uses LTR.
- Work is restricted to the `main` branch as requested.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run typecheck` — TypeScript check
- `npm run db:generate` — generate Prisma Client
- `npm run db:migrate` — create/apply a development migration
- `npm run db:deploy` — apply committed migrations
- `npm run db:studio` — open Prisma Studio
