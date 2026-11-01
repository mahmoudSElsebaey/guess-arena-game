# Phase 2 — Game UI & Core Game Experience

## Scope

Phase 2 delivers a polished, localized, responsive game experience and a deterministic local practice mode. It does not implement network rooms, matchmaking, server-authoritative turns, persistence, or real-time multiplayer; those belong to Phase 3.

## Delivered

- Localized play routes at `/[locale]/play` for Arabic RTL and English LTR.
- A 45-character dataset with distinct structured traits: skin tone, hair color and length, hat, glasses, beard, gender, and eye color.
- Locally rendered vector character portraits, avoiding external image dependencies.
- Responsive board with 45 cards and adaptive column counts.
- Practice opponent selects a hidden secret character at the start of each round.
- Nineteen yes/no questions covering identity, appearance, and accessories.
- Question answers automatically eliminate all currently active cards that do not match the answer.
- Each question can be asked once per round; used questions are disabled.
- Manual flip/restore controls, candidate and eliminated counters, round history, guess feedback, win state, and restart.
- Home CTA and site navigation link to the play arena.

## Important boundary

Practice mode runs entirely in client state and uses a randomly selected local opponent character. The secret character is not rendered in the UI. No room creation, invite code, matchmaking, cross-device synchronization, or real-time multiplayer is claimed in this phase.

## Verification checklist

- [ ] Open `/ar/play` and `/en/play`.
- [ ] Confirm 45 character cards and responsive grid.
- [ ] Start a round and confirm the secret remains hidden.
- [ ] Ask questions with both yes and no outcomes; verify incompatible cards are eliminated.
- [ ] Confirm used questions cannot be asked twice.
- [ ] Manually eliminate and restore cards.
- [ ] Guess incorrectly, then correctly in a fresh round.
- [ ] Restart and confirm counters, history, and question usage reset.
- [ ] Verify RTL/LTR layout and mobile behavior.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm run build`.
