# Security Baseline — Phase 1

## Identity and sessions

- Auth.js Credentials provider is the only enabled sign-in provider in this phase.
- Passwords are hashed with bcryptjs (cost factor 12).
- Auth.js uses signed JWT sessions for the Credentials provider.
- User ID, role, and guest status are copied into the session callback.
- Public registration always creates a PLAYER; it cannot set role or status.
- BANNED users are rejected during password authentication.

## Guest access

- Guest sign-in checks the global SiteSettings record on the server.
- The default is enabled for development and can be switched off in the database.
- Guest accounts are persisted so future game history can be attached to an identity.

## Secrets

- DATABASE_URL, DIRECT_URL, AUTH_SECRET, and ABLY_API_KEY are server-only.
- ABLY_API_KEY must never use a NEXT_PUBLIC_ prefix.
- .env files are ignored by Git; only .env.example is committed.

## Phase 1 limitations and required follow-up

- Registration and guest endpoints need an external, distributed rate limiter before public launch.
- Email verification, password reset, OAuth, session revocation UX, and abuse monitoring are deferred.
- Admin guard utilities are provided; admin management screens and audited admin actions are later-phase work.
- Ably channel authorization is not implemented until multiplayer is introduced in Phase 3.
