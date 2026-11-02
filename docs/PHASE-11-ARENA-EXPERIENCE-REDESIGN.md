# Phase 11 — Arena Experience Redesign

## Scope

A visual and interaction redesign of the public website and the online game. The work preserves the existing Next.js, PostgreSQL, Prisma, Auth.js, and Ably architecture. No database schema changes or migrations are required.

## Implemented

### Global navigation and public pages
- Dark gaming header with active navigation states, lime-green Play CTA, compact AR/EN switch, and responsive mobile menu.
- Profile dropdown without role labels in the header; includes Profile & Settings, Match History, and Sign out.
- Full profile page with editable display name, email, and password change using current-password verification.
- About and How to Play pages with bilingual gaming layouts.
- Shared animated gradient footer with a top wave; hidden on game, practice, and admin routes.
- Landing page rebuilt without the old character-board preview: hero illustration, three feature steps, and a final play CTA.

### Room entry and character selection
- Play landing page separates Create Room, Join Room, and Practice Mode.
- Dedicated /play/create and /play/join pages with localized breadcrumbs.
- Practice moved to /practice and removed from the online play entry screen.
- Secret character selection is a responsive modal with larger attribute-based illustrated portraits.

### Online match
- Dark high-contrast game surface and turn/player status panels.
- Five-second countdown overlay with synthesized sound cues.
- Fullscreen toggle for the match surface.
- Question categories with icons and category-specific question lists.
- Yes/No answer overlay displayed for two seconds.
- Character elimination is now manual and player-controlled. Asking a question no longer automatically flips cards.
- Players can flip or restore any card at any time during the active match, including restoring an accidental flip.
- A flipped card that conflicts with the latest answer receives a prominent red X warning; the player can restore it.
- Final Guess action appears only when exactly one character remains; the API enforces the same rule.
- Detailed attribute-based SVG character portraits replace the repeated emoji-only board presentation.

## Build and test

- npm ci: passed.
- npm run build: passed after fixing the question-state JSX and effect dependencies.
- npm run test:run: passed (2 test files, 8 tests).
- Prisma schema unchanged; no migration required.
- Vercel automatic production deployment may be rate-limited; check the latest commit status before announcing production readiness.

## Manual acceptance checklist

- [ ] Header active states, mobile menu, compact locale switch, and profile dropdown.
- [ ] Profile name/email/password updates and session refresh.
- [ ] About, How to Play, home, and footer on all eligible routes.
- [ ] Footer hidden on /play/*, /practice, and /admin/*.
- [ ] Create room and Join room flows, breadcrumbs, and room code readability.
- [ ] Secret character picker modal on desktop and mobile.
- [ ] Five-second countdown and sound behavior on both players' screens.
- [ ] Fullscreen enter/exit.
- [ ] Category selection and question answer overlay for both players.
- [ ] Asking a question does not automatically eliminate any card.
- [ ] Manual flip and restore work on either turn.
- [ ] Incorrectly flipped matching cards show a warning X and can be restored.
- [ ] Guess button appears only at one remaining card and the server rejects early guesses.
- [ ] 45 portraits render clearly at desktop, tablet, and mobile widths.
