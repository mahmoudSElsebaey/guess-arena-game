# Phase 6 — UI/UX Redesign

## Why this phase comes next

Core gameplay, multiplayer flow, content management, sound/motion, performance, and accessibility are already implemented. The remaining high-value portfolio work is to make the product feel like a polished game experience instead of a collection of functional screens.

## Phase 6 plan

### 6.1 Design system and visual foundation — IN PROGRESS
- Establish reusable Guess Arena design tokens and surface rules.
- Standardize panels, shadows, radii, focus treatment, responsive spacing, and interactive states.
- Keep Arabic RTL and English LTR layouts first-class.

### 6.2 Game lobby redesign
- Make create/join flow easier to scan.
- Improve room-code sharing, player readiness, waiting state, and secret-character selection.
- Add stronger visual hierarchy without changing room permissions or server rules.

### 6.3 Online match redesign
- Reorganize the live match around: match status, turn ownership, question selection, answer feedback, and the 45-character board.
- Improve desktop and mobile information density.
- Preserve server-authoritative turns and private secret characters.

### 6.4 Practice mode redesign
- Give training mode a clearer game-loop hierarchy.
- Improve question groups, remaining-character feedback, elimination states, and win state.
- Keep the existing sound and reduced-motion behavior.

### 6.5 Responsive polish and final UX pass
- Verify desktop, tablet, and mobile layouts.
- Verify RTL/LTR details.
- Check keyboard focus, touch target sizes, empty/loading/error states, and contrast.
- Run production build and deployment acceptance checks.

## Design direction

The target direction is a modern competitive casual-game UI:
- dark game-status moments contrasted with bright play surfaces;
- violet as the primary game identity;
- teal for positive/ready/live states;
- amber for attention and progress;
- character cards treated as the visual center of the product;
- subtle depth and motion, never excessive glass effects;
- fast scanning on mobile and strong hierarchy on desktop.

## 6.1 implementation notes

The first implementation adds reusable CSS variables and utilities for:
- game shell backgrounds;
- elevated and standard panels;
- subtle arena grid texture;
- consistent section headings;
- hover-safe interactive elevation;
- responsive backdrop-filter fallback.

No game rules, APIs, database schema, migrations, permissions, or realtime/polling contracts are changed by this foundation.


### 6.2 Game lobby redesign — IMPLEMENTED
- Reworked the room entry screen into clear create-room and join-room actions.
- Added six-digit invite-code input, copy feedback, and explicit room privacy messaging.
- Reorganized room members into player cards with readiness, character-selection, and connection indicators.
- Added a dedicated secret-character selection and ready/start action area.
- Added a room guide and clearer waiting-for-player state.
- Preserved the existing room API, role checks, ready requirements, and server-side start validation.

### 6.3 Online match redesign — IMPLEMENTED
- Reorganized the match into a live status header, player/turn indicators, question panel, character board, and match timeline.
- Added clearer remaining/eliminated counters and a progress indicator.
- Improved the responsive layout, including a sticky match overview on wide screens.
- Added explicit disabled/used question states, accessible character labels, and live status/error feedback.
- Preserved all existing server-authoritative ask/guess calls, sound effects, polling, and private character handling.

### 6.4 Practice mode redesign — IMPLEMENTED
- Rebuilt the practice screen around a primary character-board surface and a compact supporting rail.
- Added a clearer round-status header, prominent remaining/eliminated counters, and an elimination progress bar.
- Reorganized questions into visible groups with stronger used/disabled states.
- Improved character-card touch targets, focus visibility, and eliminated-card feedback.
- Added loading skeletons and a dedicated content-load error state.
- Preserved the practice game rules, content API, sound controls, and reduced-motion support.

### 6.5 Responsive polish and final UX pass — IMPLEMENTED
- Applied the shared arena shell and panel system to the landing page, match history, and admin overview.
- Added the shared site navigation to the admin overview for consistent navigation and language switching.
- Kept the admin room table horizontally scrollable on narrow screens.
- Improved empty-state and card surfaces on the history screen.
- Updated locale switching to retain the current localized route instead of navigating back to the home page.
- Kept Arabic RTL and English LTR layouts, keyboard focus styles, and reduced-motion preferences.
- No game rules, permissions, APIs, database schema, or migrations were changed by the visual polish.
