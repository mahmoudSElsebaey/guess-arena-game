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
- React Hook Form + Zod, Framer Motion, and Lucide React for upcoming UI work

## Phase 1 scope

- Arabic default locale at `/ar`, English at `/en`, and root locale redirect.
- RTL/LTR document direction and localized message dictionaries.
- Shared header, responsive page shell, semantic design tokens, focus states, and reduced-motion support.
- Email/password registration and login foundation.
- Guest sign-in controlled by the persisted global settings record.
- Auth.js JWT callbacks with user ID, role, and guest status.
- Prisma singleton, PostgreSQL schema, initial migration, and idempotent seed.
- Server-only environment parsing and Ably REST client factory.
- Unit test setup and CI for schema validation, generation, type checks, tests, lint, and production build.

## Database scope

The Phase 1 migration intentionally creates identity and global settings tables only. Game categories, characters, attributes, rooms, rounds, turns, event history, and results will be introduced with their owning features in later phases to avoid speculative schema churn.

## Security notes

- Passwords are stored as bcrypt hashes.
- Guest access is checked on the server against SiteSettings.
- Banned accounts cannot authenticate.
- Auth.js secrets and Ably keys are server-only.
- Public registration cannot assign the ADMIN role.
- CI does not connect to or mutate a production database.

## Acceptance checklist

- [x] Next.js App Router scaffold and strict TypeScript
- [x] Tailwind CSS v4 and semantic design tokens
- [x] Arabic/English locale routing with RTL/LTR
- [x] Shared layout and reusable UI primitives
- [x] PostgreSQL Prisma schema for identity and global settings
- [x] Initial non-destructive SQL migration
- [x] Idempotent database seed
- [x] Auth.js registration/login/guest foundation
- [x] Guest access server-side setting
- [x] Server-only Ably and environment helpers
- [x] Unit test and CI configuration
- [ ] CI checks observed passing on GitHub
- [ ] Production build executed in a dependency-enabled environment

## Explicit limitations

No real database credentials were supplied, so the migration is not applied to a live database. Ably private-channel authorization and publishing belong to Phase 3. Email verification, password reset, OAuth, profile editing, and admin UI are outside Phase 1. The phase cannot be called fully verified until CI checks pass.
