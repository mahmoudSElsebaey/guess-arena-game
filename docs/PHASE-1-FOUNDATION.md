# Phase 1 — Project Foundation and Design System

## Objective

Establish the Next.js application shell, bilingual routing, shared design foundation, PostgreSQL/Prisma identity layer, and authentication baseline without implementing multiplayer gameplay.

## Approved stack

- Next.js App Router, React, strict TypeScript
- Tailwind CSS v4
- next-intl for Arabic/English routing
- PostgreSQL + Prisma
- Auth.js Credentials provider with bcryptjs password hashing
- Ably SDK reserved for server-only realtime integration
- React Hook Form + Zod, Framer Motion, and Lucide React

## Implemented foundation

- Arabic default locale at `/ar`, English at `/en`, root locale redirect, and RTL/LTR document direction.
- Responsive shared navigation, landing page, login, and registration layouts.
- Character-board preview with a responsive 5-column layout and 45 visual placeholders.
- Email/password registration and login, plus server-controlled guest sign-in.
- Roles: `OWNER`, `ADMIN`, and `PLAYER`. Player 1 and Player 2 demo identities both use `PLAYER`.
- Auth.js JWT callbacks preserve the complete role; server guards expose `requireAdmin` and `requireOwner`.
- Public registration always creates a `PLAYER`; it cannot accept a role from the request.
- Optional idempotent demo account seeding from environment variables.
- Registration failures log safe diagnostic metadata without exposing database details to clients.
- PostgreSQL/Prisma identity schema, additive Owner enum migration, and idempotent seed.
- CI validates schema, generates Prisma Client, applies migrations to its temporary PostgreSQL service, seeds, type-checks, tests, lints, and builds.

## Demo account configuration

Set `DEMO_ACCOUNTS_ENABLED=true` before running `npm run db:seed`.

Private staff demo accounts are configured with server-only variables:
- `DEMO_OWNER_EMAIL` and `DEMO_OWNER_PASSWORD`
- `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`

Player demo accounts are deliberately public test credentials and can be displayed on the login page:
- `NEXT_PUBLIC_DEMO_PLAYER_ONE_EMAIL` and `NEXT_PUBLIC_DEMO_PLAYER_ONE_PASSWORD`
- `NEXT_PUBLIC_DEMO_PLAYER_TWO_EMAIL` and `NEXT_PUBLIC_DEMO_PLAYER_TWO_PASSWORD`

All configured demo passwords must be at least 12 characters. Never put Owner or Admin credentials in any `NEXT_PUBLIC_` variable. The login page only displays the two player demo buttons when both email and password are configured for each account.

## Database and deployment notes

- The Owner role is introduced by `20261031000100_add_owner_role`; do not edit the already-applied foundation migration.
- GitHub CI uses an ephemeral PostgreSQL database and does not apply migrations to production.
- Production must run `npx prisma migrate deploy` against the configured production database after deployment environment variables are verified.
- No production database credentials were supplied in this work, so production migration and live registration remain unverified.

## Security notes

- Passwords are stored as bcrypt hashes.
- Guest access is checked on the server against SiteSettings.
- Banned accounts cannot authenticate.
- Auth.js secrets, database URLs, and Ably keys are server-only.
- Public registration cannot assign privileged roles.
- Owner and Admin demo credentials are not rendered on public pages.

## Acceptance checklist

- [x] Next.js App Router scaffold and strict TypeScript
- [x] Tailwind CSS v4 and semantic design tokens
- [x] Arabic/English locale routing with RTL/LTR
- [x] Responsive public landing, login, and registration screens
- [x] PostgreSQL Prisma identity schema and additive Owner role migration
- [x] Public registration restricted to PLAYER
- [x] Role-aware Auth.js session and authorization guards
- [x] Environment-configured demo account seed
- [x] Registration error diagnostics without exposing internals
- [x] Unit test and CI configuration
- [ ] New CI run observed passing on GitHub
- [ ] Production database migration applied and registration verified against production
- [ ] Production deployment visually verified on desktop and mobile

## Explicit limitations

The public landing page and authentication foundation are implemented; multiplayer rooms, character selection, realtime gameplay, game history, and the admin dashboard remain later phases. Production DB credentials were not supplied, so this work does not claim that production migrations or demo accounts have been provisioned.
