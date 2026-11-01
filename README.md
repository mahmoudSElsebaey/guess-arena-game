# Guess Arena

A bilingual, real-time multiplayer character-guessing game built with Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, and Ably.

## Current status
Phase 1 and Phase 2 are complete and locally tested by the project owner. Phase 3 is in progress: the multiplayer persistence foundation is being added before room APIs, server-authoritative gameplay, and realtime synchronization.

## Requirements
- Node.js 20.9+
- npm
- PostgreSQL 14+
- Ably account and API key (required for realtime features)

## Getting started
1. Install dependencies: npm install
2. Copy .env.example to .env.local and configure PostgreSQL and Auth.js.
3. Validate Prisma: npm run db:validate
4. Generate Prisma Client: npm run db:generate
5. Apply migrations locally: npm run db:migrate
6. Seed global settings: npm run db:seed
7. Start the app: npm run dev

Open http://localhost:3000. The root route redirects to Arabic; English is available at /en.

## Environment
See .env.example. Never commit real credentials.
- DATABASE_URL: pooled PostgreSQL connection used by the app.
- DIRECT_URL: direct PostgreSQL connection used by Prisma migrations.
- AUTH_SECRET: long random secret for Auth.js.
- AUTH_URL: canonical application URL.
- ABLY_API_KEY: server-only Ably key; never expose it through a NEXT_PUBLIC_ variable.
- CLOUDINARY_*: reserved for later character media work.

## Database
Prisma migrations are additive. Never use destructive reset commands against production. The multiplayer schema stores room membership, private per-player state, and an ordered idempotent action log. Do not expose private member columns in public room responses.

## Authentication foundation
- Email/password registration stores bcrypt hashes, never plaintext passwords.
- Auth.js issues JWT-backed sessions for the Credentials provider.
- Guest sign-in is checked server-side against SiteSettings.allowGuestAccess.
- Banned accounts cannot authenticate.
- Admin role is never accepted from public registration.
- Email verification, password reset, OAuth, and account management are outside the current scope.

## Localization
Arabic is the default locale and uses RTL. English uses LTR. Message dictionaries live in messages/ar.json and messages/en.json.

## Quality commands
- npm run typecheck
- npm run lint
- npm run test:run
- npm run build

## Architecture principles
PostgreSQL is the source of truth. Prisma owns schema and migrations. Ably transports authorized realtime events but is not the game-state database. Secret character data and private elimination boards must never be exposed in public room payloads. All game commands and privileged actions are validated server-side.

## Phases
1. Foundation and design system — complete.
2. Public pages and local game experience — complete; visual redesign is deferred.
3. Multiplayer persistence, rooms, server-authoritative game engine, and realtime synchronization — in progress.
4. Admin dashboard.
5. Polish, visual redesign, and advanced features.
6. QA and deployment.
